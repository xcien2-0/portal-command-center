#!/usr/bin/env python3
"""
sync_energia_to_railway.py
Corre en el Mac. Lee los hosts del NOCBoard Energía local (9404)
y los empuja al portal en Railway para que la sección Infra Energía funcione.

Uso:
  python3 sync_energia_to_railway.py            # una vez
  python3 sync_energia_to_railway.py --loop     # cada 5 min

PM2 (recomendado):
  pm2 start sync_energia_to_railway.py --interpreter python3 \
      --name sync-energia --cron "*/5 * * * *"
"""
import sys, json, time, requests, os

NOCBOARD_URL   = "http://localhost:9404"
NOCBOARD_KEY   = "f4f5ef40c4c54aeca1d6a66109e4555d"
RAILWAY_URL    = "https://xcien.up.railway.app"
INTERVAL_S     = 300   # 5 minutos
HOSTS_JSON     = os.path.expanduser("~/Library/Application Support/NOCBoardEnergia/hosts.json")


def fetch_from_api() -> list:
    """Intenta obtener los hosts vía API del NOCBoard Energía local."""
    headers = {"X-API-Key": NOCBOARD_KEY}
    try:
        r = requests.get(f"{NOCBOARD_URL}/api/hosts", headers=headers, timeout=10)
        if r.ok:
            data = r.json()
            hosts = data.get("hosts", data) if isinstance(data, dict) else data
            # Enriquecer con métricas individuales
            enriched = []
            for h in hosts:
                hid = h.get("id", "")
                if hid:
                    try:
                        rd = requests.get(f"{NOCBOARD_URL}/api/host/{hid}", headers=headers, timeout=5)
                        if rd.ok:
                            h["_api_metrics"] = rd.json().get("metrics", {})
                    except Exception:
                        pass
                enriched.append(h)
            return enriched
    except Exception as e:
        print(f"  API no disponible: {e}")
    return []


def fetch_from_file() -> list:
    """Fallback: lee el JSON que escribe la app NOCBoard Energía localmente."""
    try:
        with open(HOSTS_JSON) as f:
            return json.load(f)
    except Exception as e:
        print(f"  Archivo no encontrado: {e}")
    return []


def push_to_railway(hosts: list) -> bool:
    try:
        r = requests.post(
            f"{RAILWAY_URL}/api/noc/energia/sync",
            json={"hosts": hosts},
            headers={"X-API-Key": NOCBOARD_KEY, "Content-Type": "application/json"},
            timeout=15,
        )
        if r.ok:
            print(f"  ✓ Railway actualizado — {len(hosts)} hosts")
            return True
        else:
            print(f"  ✗ Error Railway {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"  ✗ No se pudo conectar a Railway: {e}")
    return False


def sync_once():
    print(f"\n[{time.strftime('%Y-%m-%d %H:%M:%S')}] Sincronizando Energía → Railway...")
    hosts = fetch_from_api()
    if not hosts:
        print("  API local vacía, usando archivo...")
        hosts = fetch_from_file()
    if not hosts:
        print("  Sin datos. Nada que sincronizar.")
        return
    print(f"  {len(hosts)} hosts encontrados")
    push_to_railway(hosts)


if __name__ == "__main__":
    loop = "--loop" in sys.argv
    sync_once()
    if loop:
        print(f"\nModo loop activo. Sincronizando cada {INTERVAL_S//60} min. Ctrl+C para salir.")
        while True:
            time.sleep(INTERVAL_S)
            sync_once()
