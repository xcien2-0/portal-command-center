"""
uisp_service.py — Integración con UISP (xcien.uisp.com)
Obtiene dispositivos, topología y estado de red en tiempo real.
"""

import os
import httpx
import logging
from typing import Any

logger = logging.getLogger("XCIEN-UISP")

UISP_URL = os.getenv("UISP_URL", "https://xcien.uisp.com")
UISP_TOKEN = os.getenv("UISP_TOKEN", "")
API_BASE = f"{UISP_URL}/nms/api/v2.1"

HEADERS = {
    "x-auth-token": UISP_TOKEN,
    "Content-Type": "application/json",
}

# Cache simple en memoria para evitar hammering
_cache: dict[str, Any] = {}
_cache_ts: dict[str, float] = {}
CACHE_TTL = 30  # segundos


def _is_fresh(key: str) -> bool:
    import time
    return key in _cache and (time.time() - _cache_ts.get(key, 0)) < CACHE_TTL


async def _get(path: str) -> Any:
    import time
    if _is_fresh(path):
        return _cache[path]

    async with httpx.AsyncClient(verify=False, timeout=15) as client:
        r = await client.get(f"{API_BASE}{path}", headers=HEADERS)
        r.raise_for_status()
        data = r.json()
        _cache[path] = data
        _cache_ts[path] = time.time()
        return data


async def get_devices() -> list[dict]:
    """Lista completa de dispositivos con estado."""
    raw = await _get("/devices")
    devices = []
    for d in raw:
        ident = d.get("identification", {})
        overview = d.get("overview", {})
        devices.append({
            "id": ident.get("id"),
            "name": ident.get("displayName") or ident.get("name"),
            "model": ident.get("modelName") or ident.get("model"),
            "type": ident.get("type"),
            "category": ident.get("category"),
            "role": ident.get("role"),
            "mac": ident.get("mac"),
            "firmware": ident.get("firmwareVersion"),
            "status": overview.get("status", "unknown"),
            "can_upgrade": overview.get("canUpgrade", False),
            "signal": overview.get("signal"),
            "uplink_utilization": overview.get("uplinkUtilization"),
            "downlink_utilization": overview.get("downlinkUtilization"),
            "stations_count": overview.get("stationsCount"),
            "site": {
                "id": ident.get("site", {}).get("id"),
                "name": ident.get("site", {}).get("name"),
                "status": ident.get("site", {}).get("status"),
            } if ident.get("site") else None,
            "uplink_device": d.get("uplinkDevice", {}).get("identification", {}).get("id") if d.get("uplinkDevice") else None,
        })
    return devices


def _infer_frequency(model: str, channel_width) -> str:
    """Infiere la frecuencia de un enlace a partir del modelo y ancho de canal."""
    m = (model or "").upper()
    if any(x in m for x in ["AF60", "AIRFIBER 60", "WAVE", "60G"]):
        return "60 GHz"
    if any(x in m for x in ["AF24", "AIRFIBER 24"]):
        return "24 GHz"
    if any(x in m for x in ["AF5", "AIRFIBER 5", "AIRFIBER8"]):
        return "5 GHz"
    if channel_width and channel_width >= 1000:
        return "60 GHz"
    # airMax: casi siempre 5 GHz
    return "5 GHz"


def _link_quality(link_score, signal) -> str:
    """Calidad del enlace en palabras."""
    if link_score is not None:
        pct = round(link_score * 100)
        if pct >= 80: return f"Excelente ({pct}%)"
        if pct >= 60: return f"Buena ({pct}%)"
        if pct >= 40: return f"Regular ({pct}%)"
        return f"Mala ({pct}%)"
    if signal is not None:
        if signal >= -60: return "Excelente"
        if signal >= -70: return "Buena"
        if signal >= -80: return "Regular"
        return "Mala"
    return "Desconocida"


async def get_data_links() -> list[dict]:
    """Conexiones entre dispositivos para la topología."""
    raw = await _get("/data-links")
    links = []
    for lnk in raw:
        from_dev  = lnk.get("from", {}).get("device", {})
        to_dev    = lnk.get("to", {}).get("device", {})
        from_site = lnk.get("from", {}).get("site", {})
        to_site   = lnk.get("to", {}).get("site", {})

        from_id = from_dev.get("identification", {}).get("id") if from_dev else None
        to_id   = to_dev.get("identification", {}).get("id") if to_dev else None

        if not from_id or not to_id:
            continue

        from_ov    = (from_dev.get("overview") or {}) if from_dev else {}
        from_ident = (from_dev.get("identification") or {}) if from_dev else {}
        model      = from_ident.get("modelName") or from_ident.get("model") or ""
        ch_width   = from_ov.get("channelWidth")
        signal     = from_ov.get("signal")
        link_score = (from_ov.get("linkScore") or {}).get("linkScore")
        mode       = from_ov.get("wirelessMode", "")

        links.append({
            "id": lnk.get("id"),
            "from_device_id": from_id,
            "to_device_id":   to_id,
            "from_site": from_site.get("identification", {}).get("name") if from_site else None,
            "to_site":   to_site.get("identification", {}).get("name")   if to_site   else None,
            "model":       model,
            "frequency":   _infer_frequency(model, ch_width),
            "channel_width": ch_width,
            "signal":      signal,
            "link_score":  round(link_score * 100) if link_score is not None else None,
            "quality":     _link_quality(link_score, signal),
            "mode":        mode,
        })
    return links


async def get_topology() -> dict:
    """Dispositivos + links listos para renderizar como grafo."""
    devices, links = await _get_devices_and_links()

    # Índice por ID para lookup rápido
    dev_index = {d["id"]: d for d in devices}

    # Nodos para React Flow
    nodes = []
    for i, d in enumerate(devices):
        nodes.append({
            "id": d["id"],
            "data": {
                "label": d["name"],
                "model": d["model"],
                "type": d["type"],
                "status": d["status"],
                "signal": d.get("signal"),
                "stations": d.get("stations_count"),
                "site": d.get("site", {}).get("name") if d.get("site") else None,
            },
            "position": {"x": 0, "y": 0},  # el frontend los posiciona con layout automático
            "type": "deviceNode",
        })

    # Edges para React Flow
    edges = []
    for lnk in links:
        if lnk["from_device_id"] in dev_index and lnk["to_device_id"] in dev_index:
            edges.append({
                "id": lnk["id"],
                "source": lnk["from_device_id"],
                "target": lnk["to_device_id"],
            })

    return {"nodes": nodes, "edges": edges}


async def _get_devices_and_links():
    """Helper para obtener ambos en paralelo."""
    import asyncio
    devices, links = await asyncio.gather(get_devices(), get_data_links())
    return devices, links


async def get_sites_coords() -> dict[str, dict]:
    """Índice site_name → {lat, lng} desde UISP."""
    raw = await _get("/sites")
    index = {}
    for s in raw:
        name = s.get("identification", {}).get("name", "")
        loc = s.get("description", {}).get("location", {})
        if loc and loc.get("latitude") and loc.get("longitude"):
            index[name] = {"lat": loc["latitude"], "lng": loc["longitude"]}
    return index


async def get_topology_geo() -> list[dict]:
    """
    Links con coordenadas geográficas reales.
    Combina UISP data-links (Ubiquiti, coords exactas) y pares MU/RU de NOCBoard
    (Mimosa/Cambium, cuando están en distintas ciudades).
    """
    import asyncio, os, httpx as _httpx

    # ── UISP links ────────────────────────────────────────────────────────────
    sites_coords, raw_links = await asyncio.gather(
        get_sites_coords(), get_data_links()
    )

    uisp_links = []
    for lnk in raw_links:
        fs = lnk.get("from_site")
        ts = lnk.get("to_site")
        fc = sites_coords.get(fs)
        tc = sites_coords.get(ts)
        if fc and tc and fs != ts:
            uisp_links.append({
                "id":          lnk["id"],
                "vendor":      "Ubiquiti",
                "from_site":   fs,
                "to_site":     ts,
                "from_lat":    fc["lat"], "from_lng": fc["lng"],
                "to_lat":      tc["lat"], "to_lng":   tc["lng"],
                "status":      "active",
                "frequency":   lnk.get("frequency",   "5 GHz"),
                "channel_width": lnk.get("channel_width"),
                "signal":      lnk.get("signal"),
                "link_score":  lnk.get("link_score"),
                "quality":     lnk.get("quality", "Desconocida"),
                "mode":        lnk.get("mode", ""),
                "model":       lnk.get("model", ""),
            })

    # ── NOCBoard MU→RU inter-city links ───────────────────────────────────────
    NOCBOARD_API_BASE = os.getenv("NOCBOARD_API_BASE", "http://localhost:9401/api")
    NOCBOARD_API_KEY  = os.getenv("NOCBOARD_API_KEY",  "87a08190b801416392e944ab79c7e3c9")

    CITY_COORDS_MAP = {
        "Monterrey":        (25.6866, -100.3161),
        "Saltillo":         (25.4232, -100.9928),
        "Piedras Negras":   (28.7000, -100.5231),
        "San Luis Potosi":  (22.1565, -100.9855),
        "San Luis Potosí":  (22.1565, -100.9855),
        "Torreón":          (25.5428, -103.4068),
        "Chihuahua":        (28.6353, -106.0889),
        "Nuevo Laredo":     (27.4765,  -99.5151),
        "Reynosa":          (26.0922,  -98.2772),
        "Matamoros":        (25.8691,  -97.5027),
        "Monclova":         (26.9083, -101.4217),
        "Guadalajara":      (20.6597, -103.3496),
        "Ciudad de México": (19.4326,  -99.1332),
        "Querétaro":        (20.5888, -100.3899),
        "León":             (21.1221, -101.6823),
        "Tampico":          (22.2552,  -97.8686),
        "Mérida":           (20.9674,  -89.5926),
        "Puebla":           (19.0414,  -98.2063),
        "Celaya":           (20.5200, -100.8161),
    }

    noc_links = []
    try:
        async with _httpx.AsyncClient(timeout=5) as client:
            r = await client.get(
                f"{NOCBOARD_API_BASE}/hosts",
                headers={"X-API-Key": NOCBOARD_API_KEY}
            )
            hosts = r.json()
            if isinstance(hosts, dict):
                hosts = hosts.get("hosts", [])

        # Build site→city map
        site_city: dict[str, str] = {}
        for h in hosts:
            if h.get("site") and h.get("city"):
                site_city[h["site"].strip().lower()] = h["city"]

        # MU devices with display_name "A → B"
        for h in hosts:
            if h.get("role") != "MU":
                continue
            dn = h.get("display_name", "")
            if "→" not in dn:
                continue
            parts = dn.split("→")
            if len(parts) != 2:
                continue
            dst_site = parts[1].strip()
            dst_city = site_city.get(dst_site.lower())
            src_city = h.get("city")
            if not dst_city or not src_city or src_city == dst_city:
                continue  # skip intra-city links
            fc = CITY_COORDS_MAP.get(src_city)
            tc = CITY_COORDS_MAP.get(dst_city)
            if not fc or not tc:
                continue
            noc_links.append({
                "id": f"noc-{h['id']}",
                "vendor": h.get("vendor", "Unknown"),
                "from_site": h.get("site", src_city),
                "to_site": dst_site,
                "from_lat": fc[0], "from_lng": fc[1],
                "to_lat":   tc[0], "to_lng":   tc[1],
                "status": h.get("status", "unknown"),
            })
    except Exception as e:
        logger.warning(f"NOCBoard topology error: {e}")

    return uisp_links + noc_links


async def get_summary() -> dict:
    """Resumen de estado de la red."""
    devices = await get_devices()
    from collections import Counter
    status_count = Counter(d["status"] for d in devices)
    type_count = Counter(d["type"] for d in devices)

    return {
        "total": len(devices),
        "active": status_count.get("active", 0),
        "disconnected": status_count.get("disconnected", 0),
        "unauthorized": status_count.get("unauthorized", 0),
        "other": len(devices) - status_count.get("active", 0) - status_count.get("disconnected", 0) - status_count.get("unauthorized", 0),
        "by_type": dict(type_count.most_common()),
        "uptime_pct": round(status_count.get("active", 0) / len(devices) * 100, 1) if devices else 0,
    }
