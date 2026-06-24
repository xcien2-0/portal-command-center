#!/usr/bin/env python3
"""
NOCBoard Energia — Monitor de pruebas Independencia
Monitorea en tiempo real y documenta cada cambio detectado.
Pruebas fisicas: desconexion CFE, calor, apertura puerta, etc.
"""
import json, time, requests, os, sys
from datetime import datetime

NOCBOARD_API = "http://localhost:9404/api"
API_KEY = "f4f5ef40c4c54aeca1d6a66109e4555d"
BOT_TOKEN = "8705458778:AAF-EZa9MFWFh04yPuaxacEYmDJUJy9jRFs"
CHAT_ID = "6609271992"

TARGETS = ["172.26.18.20", "172.26.18.21"]
TARGET_NAMES = {
    "172.26.18.20": "PLANTA ELTEK",
    "172.26.18.21": "INVERSOR SAMLEX"
}

THRESHOLDS = {
    "batteryVoltageWarning": 51,
    "batteryVoltageCritical": 46,
    "batterySOCWarning": 40,
    "batterySOCCritical": 20,
    "latencyWarning": 50,
    "latencyCritical": 200,
}

prev_metrics = {}
event_log = []

def get_metrics():
    try:
        hosts = json.load(open(os.path.expanduser(
            "~/Library/Application Support/NOCBoardEnergia/hosts.json")))
        return {h["ip"]: h for h in hosts if h["ip"] in TARGETS}
    except:
        return {}

def get_api_hosts():
    try:
        r = requests.get(f"{NOCBOARD_API}/hosts",
                         headers={"X-API-Key": API_KEY}, timeout=10)
        data = r.json()
        return {h["ip"]: h for h in data.get("hosts", []) if h["ip"] in TARGETS}
    except:
        return {}

def send_tg(text):
    try:
        requests.post(f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
                      data={"chat_id": CHAT_ID, "text": text, "parse_mode": "HTML"},
                      timeout=10)
    except Exception as e:
        print(f"  [TG ERROR] {e}")

def detect_changes(ip, old_m, new_m, old_status, new_status):
    changes = []
    name = TARGET_NAMES.get(ip, ip)

    if old_status and old_status != new_status:
        if new_status == "offline":
            changes.append(("CRITICAL", f"HOST OFFLINE — {name} dejo de responder"))
        else:
            changes.append(("RECOVERY", f"HOST RECOVERED — {name} volvio online"))

    metric_checks = [
        ("mainsVoltage", "CFE", "V"),
        ("mainsPresent", "CFE Presente", ""),
        ("batteryVoltage", "Bat. Voltaje", "V"),
        ("rectifierOutputVoltage", "Rect. Voltaje", "V"),
        ("batterySOC", "Bat. SOC", "%"),
        ("batteryTemperature", "Bat. Temp", "C"),
        ("batteryCurrent", "Bat. Corriente", "A"),
        ("loadCurrent", "Carga", "A"),
        ("loadPower", "Potencia", "W"),
        ("acOutputVoltage", "AC Output", "V"),
        ("mainsFrequency", "Frecuencia", "Hz"),
        ("rectifierOutputCurrent", "Rect. Corriente", "A"),
        ("rectifierCount", "Rectificadores", ""),
        ("temperature", "Temperatura", "C"),
        ("humidity", "Humedad", "%"),
        ("doorOpen", "Puerta", ""),
    ]

    for key, label, unit in metric_checks:
        old_v = old_m.get(key)
        new_v = new_m.get(key)
        if old_v is None or new_v is None:
            continue
        if old_v == new_v:
            continue

        # Significant change detection
        try:
            if isinstance(new_v, bool) or isinstance(old_v, bool):
                changes.append(("CHANGE", f"{label}: {old_v} → {new_v}"))
                if key == "mainsPresent":
                    if new_v == False:
                        changes.append(("CRITICAL", f"CORTE CFE — {name} sin energia electrica"))
                    else:
                        changes.append(("RECOVERY", f"CFE RESTAURADO — {name} energia de vuelta"))
                if key == "doorOpen":
                    if new_v == 1 or new_v == True:
                        changes.append(("WARNING", f"PUERTA ABIERTA — {name}"))
                    else:
                        changes.append(("INFO", f"Puerta cerrada — {name}"))
                continue

            delta = abs(float(new_v) - float(old_v))
            pct = (delta / max(abs(float(old_v)), 0.01)) * 100

            if key == "mainsVoltage":
                if float(new_v) == 0 and float(old_v) > 0:
                    changes.append(("CRITICAL", f"CORTE CFE — {label}: {old_v}V → 0V"))
                elif float(new_v) > 0 and float(old_v) == 0:
                    changes.append(("RECOVERY", f"CFE RESTAURADO — {label}: 0V → {new_v}V"))
                elif pct > 5:
                    changes.append(("CHANGE", f"{label}: {old_v}{unit} → {new_v}{unit}"))

            elif key in ("batteryVoltage", "rectifierOutputVoltage"):
                if float(new_v) < THRESHOLDS["batteryVoltageCritical"]:
                    changes.append(("CRITICAL", f"{label} CRITICO: {new_v}{unit} < {THRESHOLDS['batteryVoltageCritical']}{unit}"))
                elif float(new_v) < THRESHOLDS["batteryVoltageWarning"]:
                    changes.append(("WARNING", f"{label} BAJO: {new_v}{unit} < {THRESHOLDS['batteryVoltageWarning']}{unit}"))
                elif pct > 2:
                    changes.append(("CHANGE", f"{label}: {old_v}{unit} → {new_v}{unit}"))

            elif key == "batterySOC":
                if float(new_v) < THRESHOLDS["batterySOCCritical"]:
                    changes.append(("CRITICAL", f"SOC CRITICO: {new_v}% < {THRESHOLDS['batterySOCCritical']}%"))
                elif float(new_v) < THRESHOLDS["batterySOCWarning"]:
                    changes.append(("WARNING", f"SOC BAJO: {new_v}% < {THRESHOLDS['batterySOCWarning']}%"))
                elif delta >= 1:
                    changes.append(("CHANGE", f"{label}: {old_v}{unit} → {new_v}{unit}"))

            elif key in ("batteryTemperature", "temperature"):
                if delta >= 2:
                    direction = "SUBIO" if float(new_v) > float(old_v) else "BAJO"
                    sev = "WARNING" if float(new_v) > 40 else "CHANGE"
                    changes.append((sev, f"TEMPERATURA {direction}: {old_v}{unit} → {new_v}{unit}"))

            elif key == "humidity":
                if delta >= 5:
                    changes.append(("CHANGE", f"{label}: {old_v}{unit} → {new_v}{unit}"))

            elif pct > 10:
                changes.append(("CHANGE", f"{label}: {old_v}{unit} → {new_v}{unit}"))

        except (ValueError, TypeError):
            if old_v != new_v:
                changes.append(("CHANGE", f"{label}: {old_v} → {new_v}"))

    return changes

def run_monitor(duration_min=10, interval=20):
    polls = (duration_min * 60) // interval
    start = datetime.now()
    start_str = start.strftime("%H:%M:%S")

    msg = f"""🔬 <b>PRUEBAS FISICAS — INDEPENDENCIA</b>
━━━━━━━━━━━━━━━━━━━━━━━━
Monitoreo en tiempo real iniciado
Duracion: {duration_min} min ({polls} polls)
Intervalo: {interval}s

<b>Dispositivos:</b>
⚡ PLANTA ELTEK (172.26.18.20)
🔋 INVERSOR SAMLEX (172.26.18.21)

<b>Pruebas planificadas:</b>
• Desconectar/conectar CFE
• Provocar calor
• Abrir puerta gabinete
• Desconectar puertos

<b>Detecta automaticamente:</b>
• Corte/restauracion CFE
• Cambios voltaje bateria
• Cambios SOC
• Temperatura
• Puerta abierta/cerrada
• Host offline/recovery

🕐 Inicio: {start_str}"""

    send_tg(msg)
    print(f"[{start_str}] Monitor iniciado — {duration_min}min, {interval}s intervalo")

    for poll in range(polls):
        if poll > 0:
            time.sleep(interval)

        now = datetime.now()
        now_str = now.strftime("%H:%M:%S")
        elapsed = (now - start).seconds

        file_data = get_metrics()
        api_data = get_api_hosts()

        poll_changes = []

        for ip in TARGETS:
            name = TARGET_NAMES[ip]
            fh = file_data.get(ip, {})
            ah = api_data.get(ip, {})

            metrics = fh.get("latestMetrics", {})
            status = ah.get("status", fh.get("status", "unknown"))
            ping = ah.get("ping", fh.get("lastPingResult", {}))
            health = ah.get("health_score", fh.get("healthScore", 0))

            old_m = prev_metrics.get(ip, {}).get("metrics", {})
            old_s = prev_metrics.get(ip, {}).get("status")

            changes = detect_changes(ip, old_m, metrics, old_s, status)

            prev_metrics[ip] = {"metrics": dict(metrics), "status": status}

            # Key values
            bv = metrics.get("batteryVoltage", metrics.get("rectifierOutputVoltage", "-"))
            mv = metrics.get("mainsVoltage", "-")
            soc = metrics.get("batterySOC", "-")
            mp = metrics.get("mainsPresent", "-")
            lc = metrics.get("loadCurrent", metrics.get("loadPower", "-"))
            temp = metrics.get("batteryTemperature", metrics.get("temperature", "-"))
            lat = ping.get("latency_avg", ping.get("latencyAvg", "-"))

            s_icon = "🟢" if status == "online" else "🔴"
            line = f"  {s_icon} {name} | Bat:{bv}V CFE:{mv}V SOC:{soc} Load:{lc} Temp:{temp} Lat:{lat}ms HP:{health:.0f}"
            print(f"[{now_str}] P{poll+1} {line}")

            if changes:
                for sev, detail in changes:
                    icon = {"CRITICAL":"🚨","WARNING":"⚠️","RECOVERY":"✅","CHANGE":"🔄","INFO":"ℹ️"}.get(sev,"📌")
                    event = {"time": now_str, "elapsed": f"{elapsed}s", "device": name,
                             "ip": ip, "severity": sev, "detail": detail}
                    event_log.append(event)
                    poll_changes.append(f"  {icon} [{sev}] {name}: {detail}")
                    print(f"  >>> {icon} {sev}: {detail}")

        if poll_changes:
            change_msg = f"""⚡ <b>CAMBIO DETECTADO</b> — Poll #{poll+1} ({now_str})
━━━━━━━━━━━━━━━━━━━━━━━━
{chr(10).join(poll_changes)}
━━━━━━━━━━━━━━━━━━━━━━━━
⏱ Tiempo transcurrido: {elapsed}s"""
            send_tg(change_msg)
        elif poll % 5 == 0:
            # Heartbeat every 5 polls
            hb_lines = []
            for ip in TARGETS:
                fh = file_data.get(ip, {})
                m = fh.get("latestMetrics", {})
                bv = m.get("batteryVoltage", m.get("rectifierOutputVoltage", "-"))
                mv = m.get("mainsVoltage", "-")
                s = api_data.get(ip, {}).get("status", "?")
                si = "🟢" if s == "online" else "🔴"
                hb_lines.append(f"  {si} {TARGET_NAMES[ip]}: Bat:{bv}V CFE:{mv}V")
            send_tg(f"💓 Heartbeat P{poll+1}/{polls} — {now_str}\n" + "\n".join(hb_lines))

    # Final report
    end = datetime.now()
    duration = (end - start).seconds

    report = f"""📋 <b>REPORTE FINAL — PRUEBAS INDEPENDENCIA</b>
━━━━━━━━━━━━━━━━━━━━━━━━
Inicio: {start.strftime('%H:%M:%S')}
Fin: {end.strftime('%H:%M:%S')}
Duracion: {duration}s ({duration//60}min)
Polls: {polls}

<b>Eventos detectados: {len(event_log)}</b>
"""
    if event_log:
        for e in event_log:
            icon = {"CRITICAL":"🚨","WARNING":"⚠️","RECOVERY":"✅","CHANGE":"🔄","INFO":"ℹ️"}.get(e["severity"],"📌")
            report += f"\n  {icon} [{e['time']}] {e['device']}: {e['detail']}"
    else:
        report += "\n  Sin eventos — todo estable durante la prueba"

    report += f"""

<b>Estado final:</b>"""
    for ip in TARGETS:
        m = prev_metrics.get(ip, {}).get("metrics", {})
        s = prev_metrics.get(ip, {}).get("status", "?")
        si = "🟢" if s == "online" else "🔴"
        bv = m.get("batteryVoltage", m.get("rectifierOutputVoltage", "-"))
        mv = m.get("mainsVoltage", "-")
        soc = m.get("batterySOC", "-")
        report += f"\n  {si} {TARGET_NAMES[ip]}: Bat:{bv}V CFE:{mv}V SOC:{soc}"

    report += "\n\n📡 XCIEN Networks — NOCBoard Energia v3.9.6"
    send_tg(report)

    # Save log
    log_path = os.path.expanduser(
        "~/Antigravity/backend/data/independencia_test_log.json")
    with open(log_path, "w") as f:
        json.dump({"start": start.isoformat(), "end": end.isoformat(),
                    "polls": polls, "interval": interval,
                    "events": event_log}, f, indent=2)
    print(f"\nLog guardado: {log_path}")
    print(f"Eventos: {len(event_log)}")

if __name__ == "__main__":
    dur = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    intv = int(sys.argv[2]) if len(sys.argv) > 2 else 20
    run_monitor(duration_min=dur, interval=intv)
