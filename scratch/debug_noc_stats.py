import requests
import json

def _host_status(host: dict) -> str:
    score = host.get("health_score") or host.get("healthScore", 0)
    ping  = host.get("ping") or host.get("lastPingResult", {})
    reachable = ping.get("reachable", False) if "reachable" in ping else (ping.get("packet_loss", 100) < 100)
    if not reachable: return "offline"
    if score < 70: return "degraded"
    return "online"

try:
    r = requests.get("http://localhost:9401/api/hosts")
    hosts = r.json().get("hosts", [])
    stats = {"online": 0, "degraded": 0, "offline": 0}
    for h in hosts:
        stats[_host_status(h)] += 1
    print(json.dumps(stats))
except Exception as e:
    print(f"Error: {e}")
