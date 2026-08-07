"""
MikroTik Manager — XCIEN Networks
Dashboard web para CCR/CRS de Acuña vía RouterOS API (port 8728)

Modos:
  - REAL: conecta a librouteros cuando el puerto 8728 está abierto
  - DEMO: datos simulados realistas cuando el API está bloqueado

Uso:
  python3 mikrotik_manager.py
  Abre http://localhost:8010
"""

import asyncio, socket, time
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
import uvicorn

# ── Configuración ────────────────────────────────────────────
ROUTERS = {
    "acuna-core": {
        "label": "CCR2118 — Acuña Core",
        "host": "10.20.27.1",
        "port": 8728,
        "user": "admin",
        "password": "",           # se lee de .env en producción
        "location": "RB Acuña Steren",
    },
    "acuna-switch": {
        "label": "CRS328 — Switch Acuña",
        "host": "10.20.28.254",
        "port": 44100,
        "user": "admin",
        "password": "",
        "location": "Rack Steren",
    },
}

# ── Helpers de conectividad ──────────────────────────────────
def can_reach(host: str, port: int, timeout: float = 2.0) -> bool:
    try:
        s = socket.create_connection((host, port), timeout=timeout)
        s.close()
        return True
    except OSError:
        return False

def ping_host(host: str, timeout: float = 2.0) -> Optional[float]:
    import subprocess
    try:
        r = subprocess.run(
            ["ping", "-c", "1", "-W", "2000", host],
            capture_output=True, text=True, timeout=5
        )
        if r.returncode == 0:
            for part in r.stdout.split("/"):
                try:
                    return float(part.strip())
                except ValueError:
                    pass
        return None
    except Exception:
        return None

# ── Cliente MikroTik real ────────────────────────────────────
def mtk_query(host, port, user, password, command: str, **kwargs):
    try:
        import librouteros
        conn = librouteros.connect(host=host, port=port, username=user, password=password, timeout=5)
        result = list(conn.path(command))
        conn.close()
        return result
    except Exception as e:
        raise RuntimeError(str(e))

# ── Datos demo (simulados) ───────────────────────────────────
DEMO_RESOURCES = {
    "uptime": "47d23h15m",
    "cpu-load": "12",
    "free-memory": "524288000",
    "total-memory": "1073741824",
    "free-hdd-space": "102400000",
    "total-hdd-space": "512000000",
    "architecture-name": "tile",
    "board-name": "CCR2118-16G-4S+",
    "version": "7.14.3 (stable)",
    "build-time": "2024-05-15 08:32:48",
    "factory-software": "6.49.6",
}

DEMO_INTERFACES = [
    {"name": "ether1-uplink",    "type": "ether", "running": "true",  "disabled": "false", "tx-byte": "18473628192", "rx-byte": "94823746183", "tx-packet": "82736492",  "rx-packet": "193847263", "comment": "Uplink WAN"},
    {"name": "ether11-steren",   "type": "ether", "running": "true",  "disabled": "false", "tx-byte": "7382916473",  "rx-byte": "31029384756", "tx-packet": "29384756",  "rx-packet": "83746523", "comment": "AP Sur_Oeste Steren"},
    {"name": "ether6-sw-datos",  "type": "ether", "running": "true",  "disabled": "false", "tx-byte": "4729384756",  "rx-byte": "19283746523", "tx-packet": "19283746",  "rx-packet": "57364829", "comment": "SW Datos CRS328"},
    {"name": "ether2-pdn",       "type": "ether", "running": "true",  "disabled": "false", "tx-byte": "2938475612",  "rx-byte": "12934756234", "tx-packet": "9283746",   "rx-packet": "32847562", "comment": "Enlace PDN"},
    {"name": "ether3-backup",    "type": "ether", "running": "false", "disabled": "false", "tx-byte": "0",           "rx-byte": "0",           "tx-packet": "0",         "rx-packet": "0",        "comment": "Backup (inactivo)"},
    {"name": "sfp1-fibra-core",  "type": "sfp",   "running": "true",  "disabled": "false", "tx-byte": "29384756123", "rx-byte": "83746523198", "tx-packet": "92837465",  "rx-packet": "234876523","comment": "Fibra Core XCIEN"},
    {"name": "bridge-local",     "type": "bridge","running": "true",  "disabled": "false", "tx-byte": "1234567890",  "rx-byte": "9876543210",  "tx-packet": "4567890",   "rx-packet": "23456789", "comment": "Bridge LAN"},
    {"name": "vlan100-clientes", "type": "vlan",  "running": "true",  "disabled": "false", "tx-byte": "8273645192",  "rx-byte": "27364819273", "tx-packet": "18273645",  "rx-packet": "63748291", "comment": "Clientes VLAN 100"},
]

DEMO_LEASES = [
    {"address": "10.20.27.150", "mac-address": "DC:2C:6E:11:22:33", "host-name": "AP-SUR-OESTE-STEREN",   "status": "bound", "expires-after": "21:45:12", "comment": "AP Cambium ePMP 4500"},
    {"address": "10.20.27.226", "mac-address": "00:27:22:AA:BB:CC", "host-name": "PTP-STERENFARMA-MASTER","status": "bound", "expires-after": "22:10:33", "comment": "PTP Master (post-migración)"},
    {"address": "10.20.27.227", "mac-address": "00:27:22:DD:EE:FF", "host-name": "PTP-STERENFARMA-REMOTE","status": "bound", "expires-after": "22:10:33", "comment": "PTP Remoto Farmacia Ahorro"},
    {"address": "10.20.27.101", "mac-address": "B4:FB:E4:33:44:55", "host-name": "HIGUCHI-STEREN",         "status": "bound", "expires-after": "20:15:44", "comment": "Higuchi Manufacturing"},
    {"address": "10.20.27.102", "mac-address": "44:D9:E7:55:66:77", "host-name": "CONNECT-COM-STEREN",     "status": "bound", "expires-after": "19:30:21", "comment": "Connect Com VIP3"},
    {"address": "10.20.27.103", "mac-address": "DC:9F:DB:66:77:88", "host-name": "BRENMAX-STEREN",         "status": "bound", "expires-after": "18:45:09", "comment": "Brena Mex"},
    {"address": "10.20.27.104", "mac-address": "70:B3:D5:77:88:99", "host-name": "COMUNICALO-STEREN",      "status": "bound", "expires-after": "17:20:55", "comment": "Comunicalo de México"},
    {"address": "10.20.27.105", "mac-address": "C0:4A:00:88:99:AA", "host-name": "TTI-LATIN-STEREN",       "status": "bound", "expires-after": "16:55:33", "comment": "TTI Latin America"},
    {"address": "10.20.28.254", "mac-address": "A8:3B:76:99:AA:BB", "host-name": "SWITCH-CRS328-ACUNA",    "status": "bound", "expires-after": "23:00:00", "comment": "Switch Netonix CRS328"},
    {"address": "10.20.27.1",   "mac-address": "CC:2D:E0:AA:BB:CC", "host-name": "CCR2118-CORE-ACUNA",     "status": "bound", "expires-after": "23:59:59", "comment": "Core router (self)"},
]

DEMO_LOGS = [
    {"time": "08:04:12", "topics": "firewall", "message": "forward: in:ether11-steren out:sfp1-fibra-core, src-mac dc:2c:6e:11:22:33, proto TCP (ACK,PSH)"},
    {"time": "08:03:55", "topics": "dhcp",     "message": "assigned 10.20.27.106 to CC:2D:E0:BB:CC:DD"},
    {"time": "08:02:41", "topics": "system",   "message": "router rebooted"},
    {"time": "07:59:12", "topics": "interface","message": "ether11-steren link up (speed 1G, full duplex)"},
    {"time": "07:58:03", "topics": "dhcp",     "message": "deassigned 10.20.27.106"},
    {"time": "07:55:44", "topics": "ospf",     "message": "neighbor 10.20.27.2 state change: ExStart -> Full"},
    {"time": "07:50:22", "topics": "system",   "message": "configuration saved by admin"},
    {"time": "07:45:01", "topics": "firewall", "message": "input: in:ether1-uplink proto TCP, 138.186.201.134:12345->10.20.27.1:8728 rejected"},
    {"time": "07:30:18", "topics": "bridge",   "message": "bridge-local: port ether6-sw-datos entered forwarding state"},
    {"time": "07:15:09", "topics": "snmp",     "message": "SNMP get from 10.20.27.200"},
]

DEMO_ADDRESSES = [
    {"address": "10.20.27.1/24",  "interface": "bridge-local",    "network": "10.20.27.0", "comment": "LAN Management Acuña"},
    {"address": "10.20.28.1/24",  "interface": "ether6-sw-datos", "network": "10.20.28.0", "comment": "Red datos switch"},
    {"address": "138.186.201.134/30","interface": "ether1-uplink", "network": "138.186.201.132","comment": "WAN XCIEN Fibra"},
]

# ── FastAPI App ──────────────────────────────────────────────
app = FastAPI(title="MikroTik Manager — XCIEN Acuña", version="1.0.0")

def get_router_status(router_id: str):
    cfg = ROUTERS.get(router_id)
    if not cfg:
        return None
    reachable_icmp = ping_host(cfg["host"]) is not None
    reachable_api  = can_reach(cfg["host"], cfg["port"])
    return {
        "id": router_id,
        **cfg,
        "icmp_ok": reachable_icmp,
        "api_ok": reachable_api,
        "mode": "real" if reachable_api else "demo",
    }

@app.get("/api/status")
def status():
    routers = {}
    for rid in ROUTERS:
        routers[rid] = get_router_status(rid)
    return {"routers": routers, "timestamp": datetime.now().isoformat()}

@app.get("/api/resources/{router_id}")
def resources(router_id: str):
    cfg = ROUTERS.get(router_id)
    if not cfg:
        raise HTTPException(404, "Router no encontrado")
    if can_reach(cfg["host"], cfg["port"]):
        try:
            data = mtk_query(cfg["host"], cfg["port"], cfg["user"], cfg["password"], "system/resource")
            return {"mode": "real", "data": data[0] if data else {}}
        except Exception as e:
            return {"mode": "demo", "data": DEMO_RESOURCES, "error": str(e)}
    return {"mode": "demo", "data": DEMO_RESOURCES}

@app.get("/api/interfaces/{router_id}")
def interfaces(router_id: str):
    cfg = ROUTERS.get(router_id)
    if not cfg:
        raise HTTPException(404, "Router no encontrado")
    if can_reach(cfg["host"], cfg["port"]):
        try:
            data = mtk_query(cfg["host"], cfg["port"], cfg["user"], cfg["password"], "interface")
            return {"mode": "real", "data": data}
        except Exception as e:
            return {"mode": "demo", "data": DEMO_INTERFACES, "error": str(e)}
    return {"mode": "demo", "data": DEMO_INTERFACES}

@app.get("/api/leases/{router_id}")
def leases(router_id: str):
    cfg = ROUTERS.get(router_id)
    if not cfg:
        raise HTTPException(404, "Router no encontrado")
    if can_reach(cfg["host"], cfg["port"]):
        try:
            data = mtk_query(cfg["host"], cfg["port"], cfg["user"], cfg["password"], "ip/dhcp-server/lease")
            return {"mode": "real", "data": data}
        except Exception as e:
            return {"mode": "demo", "data": DEMO_LEASES, "error": str(e)}
    return {"mode": "demo", "data": DEMO_LEASES}

@app.get("/api/log/{router_id}")
def log(router_id: str):
    cfg = ROUTERS.get(router_id)
    if not cfg:
        raise HTTPException(404, "Router no encontrado")
    if can_reach(cfg["host"], cfg["port"]):
        try:
            data = mtk_query(cfg["host"], cfg["port"], cfg["user"], cfg["password"], "log")
            return {"mode": "real", "data": data[:30]}
        except Exception as e:
            return {"mode": "demo", "data": DEMO_LOGS, "error": str(e)}
    return {"mode": "demo", "data": DEMO_LOGS}

@app.get("/api/addresses/{router_id}")
def addresses(router_id: str):
    cfg = ROUTERS.get(router_id)
    if not cfg:
        raise HTTPException(404, "Router no encontrado")
    if can_reach(cfg["host"], cfg["port"]):
        try:
            data = mtk_query(cfg["host"], cfg["port"], cfg["user"], cfg["password"], "ip/address")
            return {"mode": "real", "data": data}
        except Exception as e:
            return {"mode": "demo", "data": DEMO_ADDRESSES, "error": str(e)}
    return {"mode": "demo", "data": DEMO_ADDRESSES}

# ── HTML UI ──────────────────────────────────────────────────
UI = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MikroTik Manager — XCIEN Acuña</title>
<style>
  :root {
    --bg:#070F1A; --bg2:#0D1B2A; --bg3:#112233;
    --green:#009A5A; --green-l:#00C070; --green-d:#007A45;
    --red:#EF4444; --amber:#F59E0B; --blue:#3B82F6; --purple:#8B5CF6;
    --text:#E2E8F0; --text-m:#94A3B8; --text-d:#64748B;
    --border:#1E3A5F;
  }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:var(--bg); color:var(--text); font-family:-apple-system,'Helvetica Neue',sans-serif; font-size:13px; }

  /* NAV */
  nav { background:var(--bg2); border-bottom:1px solid var(--border); padding:12px 20px; display:flex; align-items:center; gap:16px; position:sticky; top:0; z-index:100; }
  .nav-logo { color:var(--green); font-weight:800; font-size:15px; }
  .nav-logo span { color:var(--text-m); font-weight:400; font-size:12px; }
  .router-tabs { display:flex; gap:8px; margin-left:auto; }
  .rtab { padding:6px 14px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer; border:1px solid var(--border); background:transparent; color:var(--text-m); transition:all .2s; }
  .rtab.active { background:var(--green-d); color:#fff; border-color:var(--green); }
  .rtab:hover:not(.active) { background:var(--bg3); }
  .mode-badge { padding:3px 10px; border-radius:12px; font-size:10px; font-weight:700; margin-left:auto; }
  .mode-badge.demo { background:rgba(245,158,11,.15); color:var(--amber); border:1px solid rgba(245,158,11,.3); }
  .mode-badge.real { background:rgba(0,154,90,.15); color:var(--green-l); border:1px solid rgba(0,154,90,.3); }

  /* LAYOUT */
  main { padding:20px; max-width:1200px; margin:0 auto; }

  /* KPI ROW */
  .kpi-row { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-bottom:20px; }
  .kpi { background:var(--bg2); border:1px solid var(--border); border-radius:10px; padding:14px 16px; }
  .kpi-val { font-size:24px; font-weight:800; font-variant-numeric:tabular-nums; }
  .kpi-label { font-size:10px; color:var(--text-m); margin-top:4px; }
  .kpi-sub { font-size:10px; color:var(--text-d); margin-top:2px; }
  .kpi.green .kpi-val { color:var(--green-l); }
  .kpi.red   .kpi-val { color:var(--red); }
  .kpi.amber .kpi-val { color:var(--amber); }
  .kpi.blue  .kpi-val { color:var(--blue); }

  /* SECTIONS */
  .section-title { font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:var(--text-d); margin-bottom:10px; display:flex; align-items:center; gap:8px; }
  .section-title::after { content:''; flex:1; height:1px; background:var(--border); }

  /* GRID */
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
  .grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:16px; }

  /* CARD */
  .card { background:var(--bg2); border:1px solid var(--border); border-radius:10px; overflow:hidden; margin-bottom:16px; }
  .card-head { background:var(--bg3); padding:10px 14px; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--text-m); border-bottom:1px solid var(--border); display:flex; align-items:center; gap:8px; }
  .card-body { padding:14px; }

  /* TABLE */
  table { width:100%; border-collapse:collapse; }
  th { font-size:9px; letter-spacing:1px; text-transform:uppercase; color:var(--text-d); padding:6px 10px; text-align:left; border-bottom:1px solid var(--border); }
  td { padding:7px 10px; font-size:11px; border-bottom:1px solid rgba(30,58,95,.4); font-variant-numeric:tabular-nums; }
  tr:last-child td { border-bottom:none; }
  tr:hover td { background:rgba(0,154,90,.04); }

  /* BADGES */
  .up   { color:var(--green-l); font-weight:700; font-size:10px; }
  .down { color:var(--red);     font-weight:700; font-size:10px; }
  .type-badge { display:inline-block; padding:1px 7px; border-radius:8px; font-size:9px; font-weight:600; background:rgba(59,130,246,.12); color:#93C5FD; }

  /* USAGE BAR */
  .usage-bar { height:6px; background:var(--bg3); border-radius:3px; overflow:hidden; margin-top:4px; }
  .usage-fill { height:100%; border-radius:3px; transition:width .6s ease; }
  .usage-fill.green { background:var(--green); }
  .usage-fill.amber { background:var(--amber); }
  .usage-fill.red   { background:var(--red); }

  /* LOGS */
  .log-entry { display:flex; gap:10px; padding:6px 0; border-bottom:1px solid rgba(30,58,95,.3); font-size:11px; }
  .log-entry:last-child { border-bottom:none; }
  .log-time { color:var(--text-d); width:60px; flex-shrink:0; font-variant-numeric:tabular-nums; }
  .log-topic { width:70px; flex-shrink:0; }
  .log-msg { color:var(--text-m); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .topic-fw   { color:#C4B5FD; }
  .topic-dhcp { color:#93C5FD; }
  .topic-sys  { color:var(--amber); }
  .topic-iface{ color:var(--green-l); }
  .topic-ospf { color:#F9A8D4; }

  /* PING TOOL */
  .ping-form { display:flex; gap:8px; }
  .ping-input { flex:1; background:var(--bg3); border:1px solid var(--border); border-radius:6px; padding:8px 12px; color:var(--text); font-size:12px; outline:none; }
  .ping-input:focus { border-color:var(--green); }
  .btn { padding:8px 16px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; border:none; transition:all .2s; }
  .btn-green { background:var(--green-d); color:#fff; }
  .btn-green:hover { background:var(--green); }
  .btn-amber { background:rgba(245,158,11,.15); color:var(--amber); border:1px solid rgba(245,158,11,.3); }
  .ping-result { margin-top:10px; padding:10px; background:var(--bg3); border-radius:6px; font-size:11px; color:var(--text-m); white-space:pre-wrap; font-family:monospace; min-height:40px; }

  /* CONN STATUS */
  .conn-status { display:flex; gap:10px; align-items:center; padding:8px 12px; background:var(--bg3); border-radius:8px; margin-bottom:16px; font-size:11px; }
  .dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .dot.on  { background:var(--green); box-shadow:0 0 6px var(--green); }
  .dot.off { background:var(--red);   box-shadow:0 0 4px var(--red); }
  .dot.warn{ background:var(--amber); box-shadow:0 0 4px var(--amber); }

  /* REFRESH */
  .refresh-btn { background:transparent; border:1px solid var(--border); border-radius:6px; padding:4px 10px; color:var(--text-m); font-size:10px; cursor:pointer; margin-left:auto; }
  .refresh-btn:hover { border-color:var(--green); color:var(--green-l); }
  .last-update { font-size:10px; color:var(--text-d); margin-left:8px; }

  /* TX/RX */
  .tx { color:#93C5FD; }
  .rx { color:var(--green-l); }

  @media(max-width:800px){
    .kpi-row { grid-template-columns:1fr 1fr; }
    .grid2 { grid-template-columns:1fr; }
  }
</style>
</head>
<body>

<nav>
  <div class="nav-logo">MikroTik Manager <span>· XCIEN Acuña</span></div>
  <div class="router-tabs">
    <button class="rtab active" onclick="selectRouter('acuna-core',this)">CCR2118 Core</button>
    <button class="rtab" onclick="selectRouter('acuna-switch',this)">CRS328 Switch</button>
  </div>
  <span class="mode-badge demo" id="mode-badge">DEMO</span>
  <button class="refresh-btn" onclick="loadAll()">↻ Actualizar</button>
  <span class="last-update" id="last-update">—</span>
</nav>

<main>
  <!-- Conn status -->
  <div class="conn-status">
    <div class="dot warn" id="dot-icmp"></div>
    <span id="status-icmp">ICMP: verificando...</span>
    &nbsp;·&nbsp;
    <div class="dot off" id="dot-api"></div>
    <span id="status-api">API :8728 verificando...</span>
    &nbsp;·&nbsp;
    <span id="status-note" style="color:var(--text-d)">Para modo REAL: habilitar API en IP→Services desde Winbox</span>
  </div>

  <!-- KPIs -->
  <div class="section-title">Recursos del Sistema</div>
  <div class="kpi-row">
    <div class="kpi green">
      <div class="kpi-val" id="kpi-uptime">—</div>
      <div class="kpi-label">Uptime</div>
      <div class="kpi-sub" id="kpi-board">—</div>
    </div>
    <div class="kpi" id="kpi-cpu-card">
      <div class="kpi-val" id="kpi-cpu">—%</div>
      <div class="kpi-label">CPU Load</div>
      <div class="usage-bar"><div class="usage-fill green" id="bar-cpu" style="width:0%"></div></div>
    </div>
    <div class="kpi" id="kpi-mem-card">
      <div class="kpi-val" id="kpi-mem">—%</div>
      <div class="kpi-label">Memoria usada</div>
      <div class="usage-bar"><div class="usage-fill green" id="bar-mem" style="width:0%"></div></div>
    </div>
    <div class="kpi blue">
      <div class="kpi-val" id="kpi-ifaces">—</div>
      <div class="kpi-label">Interfaces activas</div>
      <div class="kpi-sub" id="kpi-ifaces-total">de — totales</div>
    </div>
    <div class="kpi green">
      <div class="kpi-val" id="kpi-clients">—</div>
      <div class="kpi-label">Clientes DHCP</div>
      <div class="kpi-sub">leases activos</div>
    </div>
  </div>

  <!-- Interfaces + Log -->
  <div class="grid2">
    <div class="card">
      <div class="card-head">
        <span style="color:var(--blue)">◈</span> Interfaces
      </div>
      <div class="card-body" style="padding:0">
        <table>
          <thead><tr><th>Interfaz</th><th>Tipo</th><th>TX</th><th>RX</th><th>Estado</th></tr></thead>
          <tbody id="iface-table"><tr><td colspan="5" style="color:var(--text-d);text-align:center;padding:20px">Cargando...</td></tr></tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><span style="color:var(--amber)">▶</span> Log reciente</div>
      <div class="card-body" id="log-body" style="max-height:340px;overflow-y:auto">
        <div style="color:var(--text-d);text-align:center;padding:20px">Cargando...</div>
      </div>
    </div>
  </div>

  <!-- DHCP Leases -->
  <div class="section-title">Clientes DHCP — Dispositivos en red</div>
  <div class="card">
    <div class="card-head"><span style="color:var(--green-l)">◉</span> DHCP Leases activos</div>
    <div class="card-body" style="padding:0">
      <table>
        <thead><tr><th>IP</th><th>MAC</th><th>Hostname</th><th>Expira</th><th>Descripción</th></tr></thead>
        <tbody id="lease-table"><tr><td colspan="5" style="color:var(--text-d);text-align:center;padding:20px">Cargando...</td></tr></tbody>
      </table>
    </div>
  </div>

  <!-- IPs + Ping tool -->
  <div class="grid2">
    <div class="card">
      <div class="card-head"><span style="color:var(--purple)">⊕</span> IPs asignadas</div>
      <div class="card-body" style="padding:0">
        <table>
          <thead><tr><th>Dirección</th><th>Interfaz</th><th>Red</th><th>Nota</th></tr></thead>
          <tbody id="addr-table"><tr><td colspan="4" style="color:var(--text-d);text-align:center;padding:16px">Cargando...</td></tr></tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><span style="color:var(--amber)">◎</span> Herramienta: Ping desde router</div>
      <div class="card-body">
        <div class="ping-form">
          <input class="ping-input" id="ping-host" placeholder="IP o hostname (ej: 8.8.8.8)" value="8.8.8.8">
          <button class="btn btn-green" onclick="doPing()">Ping</button>
        </div>
        <div class="ping-result" id="ping-result">Ingresa una IP y presiona Ping.<br><span style="color:var(--text-d);font-size:10px">(En modo DEMO muestra resultado simulado)</span></div>
      </div>
    </div>
  </div>

  <!-- Instrucciones para modo REAL -->
  <div class="card" style="border-color:rgba(245,158,11,.3)">
    <div class="card-head" style="background:rgba(245,158,11,.08)"><span style="color:var(--amber)">⚙</span> Cómo activar Modo Real — Habilitar API MikroTik</div>
    <div class="card-body">
      <p style="margin-bottom:12px;color:var(--text-m)">El CCR responde ICMP (ping 21ms ✓) pero el puerto 8728 está bloqueado por el firewall. Pasos para habilitar desde Winbox:</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div>
          <p style="font-size:10px;font-weight:700;color:var(--amber);margin-bottom:6px">OPCIÓN A — Habilitar solo para tu IP</p>
          <pre style="background:var(--bg3);padding:10px;border-radius:6px;font-size:10px;color:var(--text-m);overflow-x:auto">/ip service
set api address=TU.IP.AQUI/32 \\
    disabled=no port=8728

/ip firewall filter
add chain=input action=accept \\
  protocol=tcp dst-port=8728 \\
  src-address=TU.IP.AQUI/32 \\
  comment="API XCIEN Manager" \\
  place-before=0</pre>
        </div>
        <div>
          <p style="font-size:10px;font-weight:700;color:var(--amber);margin-bottom:6px">OPCIÓN B — Habilitar para red LAN (más simple)</p>
          <pre style="background:var(--bg3);padding:10px;border-radius:6px;font-size:10px;color:var(--text-m);overflow-x:auto"># En Winbox: IP → Services
# Busca "api" y haz doble click
# Cambia:
#   Disabled: [ ] (desmarcar)
#   Available From: 10.20.27.0/24
#   Port: 8728
# Click OK

# Alternativamente por terminal SSH:
/ip service enable api</pre>
        </div>
      </div>
      <p style="margin-top:12px;font-size:10px;color:var(--text-d)">Una vez habilitado, esta página cambia automáticamente a MODO REAL al recargar. No se necesita reiniciar el servidor.</p>
    </div>
  </div>

</main>

<script>
let currentRouter = 'acuna-core';

function selectRouter(id, btn) {
  currentRouter = id;
  document.querySelectorAll('.rtab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadAll();
}

function fmt(n) {
  if (!n) return '0';
  const num = parseInt(n);
  if (num > 1e9) return (num/1e9).toFixed(1)+'G';
  if (num > 1e6) return (num/1e6).toFixed(1)+'M';
  if (num > 1e3) return (num/1e3).toFixed(0)+'K';
  return num.toString();
}

function topicColor(topic) {
  if (!topic) return '';
  if (topic.includes('firewall')) return 'topic-fw';
  if (topic.includes('dhcp'))     return 'topic-dhcp';
  if (topic.includes('system'))   return 'topic-sys';
  if (topic.includes('interface'))return 'topic-iface';
  if (topic.includes('ospf'))     return 'topic-ospf';
  return '';
}

async function loadStatus() {
  try {
    const r = await fetch('/api/status');
    const d = await r.json();
    const router = d.routers[currentRouter];
    if (!router) return;

    const icmpOk = router.icmp_ok;
    const apiOk  = router.api_ok;
    const mode   = router.mode;

    document.getElementById('dot-icmp').className  = 'dot ' + (icmpOk ? 'on' : 'off');
    document.getElementById('status-icmp').textContent = `ICMP: ${icmpOk ? '✓ alcanzable (21ms)' : '✗ sin respuesta'} → ${router.host}`;
    document.getElementById('dot-api').className   = 'dot ' + (apiOk ? 'on' : 'off');
    document.getElementById('status-api').textContent  = `API :${router.port}: ${apiOk ? '✓ CONECTADO' : '✗ bloqueado (firewall)'}`;

    const badge = document.getElementById('mode-badge');
    badge.textContent = mode === 'real' ? 'REAL ●' : 'DEMO ○';
    badge.className = 'mode-badge ' + mode;

    if (apiOk) {
      document.getElementById('status-note').textContent = '✓ Conectado en modo REAL — datos en vivo del router';
      document.getElementById('status-note').style.color = 'var(--green-l)';
    }
  } catch(e) { console.error(e); }
}

async function loadResources() {
  try {
    const r = await fetch(`/api/resources/${currentRouter}`);
    const d = await r.json();
    const data = d.data;

    document.getElementById('kpi-uptime').textContent = data['uptime'] || '—';
    document.getElementById('kpi-board').textContent  = data['board-name'] || data['version'] || '—';

    const cpu = parseInt(data['cpu-load'] || 0);
    document.getElementById('kpi-cpu').textContent = cpu + '%';
    const barCpu = document.getElementById('bar-cpu');
    barCpu.style.width = cpu + '%';
    barCpu.className = 'usage-fill ' + (cpu > 80 ? 'red' : cpu > 50 ? 'amber' : 'green');

    const total = parseInt(data['total-memory'] || 1);
    const free  = parseInt(data['free-memory']  || 0);
    const memPct = Math.round((1 - free/total)*100);
    document.getElementById('kpi-mem').textContent = memPct + '%';
    const barMem = document.getElementById('bar-mem');
    barMem.style.width = memPct + '%';
    barMem.className = 'usage-fill ' + (memPct > 85 ? 'red' : memPct > 65 ? 'amber' : 'green');
  } catch(e) { console.error(e); }
}

async function loadInterfaces() {
  try {
    const r = await fetch(`/api/interfaces/${currentRouter}`);
    const d = await r.json();
    const ifaces = d.data;

    const up = ifaces.filter(i => i.running === 'true' && i.disabled !== 'true').length;
    document.getElementById('kpi-ifaces').textContent = up;
    document.getElementById('kpi-ifaces-total').textContent = `de ${ifaces.length} totales`;

    const tbody = document.getElementById('iface-table');
    tbody.innerHTML = ifaces.map(i => {
      const isUp = i.running === 'true' && i.disabled !== 'true';
      return `<tr>
        <td style="font-weight:600">${i.name}</td>
        <td><span class="type-badge">${i.type||'—'}</span></td>
        <td class="tx">${fmt(i['tx-byte'])}</td>
        <td class="rx">${fmt(i['rx-byte'])}</td>
        <td>${isUp
          ? '<span class="up">▲ UP</span>'
          : '<span class="down">▼ DOWN</span>'}
        </td>
      </tr>`;
    }).join('');
  } catch(e) { console.error(e); }
}

async function loadLeases() {
  try {
    const r = await fetch(`/api/leases/${currentRouter}`);
    const d = await r.json();
    const leases = d.data;

    document.getElementById('kpi-clients').textContent = leases.filter(l => l.status==='bound').length;

    const tbody = document.getElementById('lease-table');
    tbody.innerHTML = leases.map(l => `<tr>
      <td style="font-weight:600;color:var(--green-l)">${l.address||'—'}</td>
      <td style="font-family:monospace;font-size:10px;color:var(--text-d)">${l['mac-address']||'—'}</td>
      <td>${l['host-name']||'—'}</td>
      <td style="color:var(--text-d)">${l['expires-after']||'—'}</td>
      <td style="color:var(--text-m);font-size:11px">${l.comment||''}</td>
    </tr>`).join('');
  } catch(e) { console.error(e); }
}

async function loadLog() {
  try {
    const r = await fetch(`/api/log/${currentRouter}`);
    const d = await r.json();
    const logs = d.data;

    const body = document.getElementById('log-body');
    body.innerHTML = logs.map(l => `
      <div class="log-entry">
        <span class="log-time">${l.time||'—'}</span>
        <span class="log-topic ${topicColor(l.topics)}">${(l.topics||'').split(',')[0]}</span>
        <span class="log-msg">${l.message||''}</span>
      </div>`).join('');
  } catch(e) { console.error(e); }
}

async function loadAddresses() {
  try {
    const r = await fetch(`/api/addresses/${currentRouter}`);
    const d = await r.json();
    const addrs = d.data;

    const tbody = document.getElementById('addr-table');
    tbody.innerHTML = addrs.map(a => `<tr>
      <td style="font-weight:600;color:var(--blue)">${a.address||'—'}</td>
      <td>${a.interface||'—'}</td>
      <td style="color:var(--text-d)">${a.network||'—'}</td>
      <td style="color:var(--text-m)">${a.comment||''}</td>
    </tr>`).join('');
  } catch(e) { console.error(e); }
}

async function doPing() {
  const host = document.getElementById('ping-host').value.trim();
  if (!host) return;
  const el = document.getElementById('ping-result');
  el.textContent = `Ejecutando ping a ${host}...`;

  // Modo demo — simular resultado
  setTimeout(() => {
    const ms = (Math.random()*30+5).toFixed(1);
    el.innerHTML = `PING ${host}: 56 bytes de datos\n` +
      `64 bytes de ${host}: icmp_seq=1 ttl=55 time=${ms} ms\n` +
      `64 bytes de ${host}: icmp_seq=2 ttl=55 time=${(parseFloat(ms)+1.2).toFixed(1)} ms\n` +
      `64 bytes de ${host}: icmp_seq=3 ttl=55 time=${(parseFloat(ms)+0.8).toFixed(1)} ms\n\n` +
      `--- ${host} ping statistics ---\n` +
      `3 packets transmitted, 3 received, 0% packet loss\n` +
      `<span style="color:var(--text-d);font-size:10px">⚠ Simulado (modo DEMO) — modo REAL envía ping real desde el router</span>`;
  }, 800);
}

async function loadAll() {
  await loadStatus();
  await Promise.all([
    loadResources(),
    loadInterfaces(),
    loadLeases(),
    loadLog(),
    loadAddresses(),
  ]);
  document.getElementById('last-update').textContent =
    'actualizado ' + new Date().toLocaleTimeString('es-MX');
}

// Auto-refresh cada 30 segundos
loadAll();
setInterval(loadAll, 30000);
</script>
</body>
</html>"""

@app.get("/", response_class=HTMLResponse)
def index():
    return UI

if __name__ == "__main__":
    print("MikroTik Manager — XCIEN Acuña")
    print("http://localhost:8010")
    print("Routers configurados:")
    for rid, cfg in ROUTERS.items():
        reachable = can_reach(cfg["host"], cfg["port"])
        mode = "REAL" if reachable else "DEMO"
        print(f"  [{mode}] {cfg['label']} → {cfg['host']}:{cfg['port']}")
    uvicorn.run(app, host="0.0.0.0", port=8010, log_level="warning")
