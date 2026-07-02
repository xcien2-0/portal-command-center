"""
Script de limpieza única para alarmas stale de energía.
Elimina de alarm_active las alarmas de hosts que actualmente están online
pero tienen mainsOutage/siteOnBatteryBackup/battery* sin cerrar.

Ejecutar una vez después de aplicar los fixes de alarm_ingestion.py.
"""
import sqlite3
import json
import requests
import os
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "db", "alarm_log.db")
API_URL = "http://localhost:9404/api"
API_KEY = "f4f5ef40c4c54aeca1d6a66109e4555d"
POWER_TYPES = ("mainsOutage", "siteOnBatteryBackup", "batteryVoltageLow", "batterySOCLow")

def get_online_hosts():
    try:
        r = requests.get(f"{API_URL}/hosts", headers={"X-API-Key": API_KEY}, timeout=10)
        if r.ok:
            return {h["id"]: h for h in r.json().get("hosts", []) if h.get("status") == "online"}
    except Exception as e:
        print(f"  No se pudo consultar API: {e}")
    return {}

def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    print("=== Limpieza de alarmas stale de energía ===\n")

    # Todas las alarmas de energía activas
    rows = conn.execute(
        "SELECT * FROM alarm_active WHERE raw_alert_type IN ({})".format(
            ",".join("?" * len(POWER_TYPES))), POWER_TYPES).fetchall()

    print(f"Alarmas de energía activas en BD: {len(rows)}")
    if not rows:
        print("Nada que limpiar.")
        return

    online = get_online_hosts()
    print(f"Hosts online en NOCBoard: {len(online)}\n")

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    cleared = 0
    stale_any = 0

    for row in rows:
        host_id = row["host_id"]
        host_name = row["host_name"]
        alert_type = row["raw_alert_type"]
        raised_at = row["raised_at"]
        cid = row["correlation_id"]

        is_online = host_id in online
        label = "ONLINE (stale)" if is_online else "OFFLINE"
        print(f"  [{label}] {host_name} | {alert_type} | desde {raised_at}")
        stale_any += 1

        if is_online:
            # Insertar evento de clear en alarm_events
            import uuid
            eid = str(uuid.uuid4())
            conn.execute("""
                INSERT INTO alarm_events (event_id, host_id, host_ip, host_name, city, site,
                    vendor, device_type, alarm_type, perceived_severity, probable_cause,
                    specific_problem, event_type, correlation_id, event_time, raw_alert_type,
                    raw_data, shift_date, shift_period)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (eid, row["host_id"], row["host_ip"], row["host_name"], row["city"],
                  row["site"], row["vendor"], row["device_type"], row["alarm_type"],
                  "cleared", row["probable_cause"],
                  f"Stale alarm cleaned: host is online, alarm was open since {raised_at}",
                  "clear", cid, now, alert_type, "{}", now[:10], "day"))

            # Eliminar de alarmas activas
            conn.execute("DELETE FROM alarm_active WHERE correlation_id = ?", (cid,))
            cleared += 1

    conn.commit()
    conn.close()

    print(f"\nResultado: {cleared} alarmas stale eliminadas de {stale_any} encontradas.")
    if stale_any - cleared > 0:
        print(f"  {stale_any - cleared} alarmas en hosts offline — se limpiarán automáticamente cuando vuelvan online.")

if __name__ == "__main__":
    main()
