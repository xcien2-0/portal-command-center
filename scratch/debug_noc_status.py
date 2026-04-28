import requests
import json

def _host_status(host: dict) -> str:
    score = host.get("health_score") or host.get("healthScore", 0)
    ping  = host.get("ping") or host.get("lastPingResult", {})
    reachable = ping.get("reachable", False) if "reachable" in ping else (ping.get("packet_loss", 100) < 100)
    
    if not reachable:
        return "offline"
    if score < 70:
        return "degraded"
    return "online"

try:
    r = requests.get("http://localhost:9401/api/hosts")
    data = r.json()
    hosts = data.get("hosts", [])
    print(f"Total hosts: {len(hosts)}")
    for h in hosts[:5]:
        status = _host_status(h)
        print(f"Host: {h.get('display_name') or h.get('name')} | Status: {status} | Score: {h.get('health_score') or h.get('healthScore')} | Reachable: {h.get('ping', {}).get('reachable')}")
except Exception as e:
    print(f"Error: {e}")
