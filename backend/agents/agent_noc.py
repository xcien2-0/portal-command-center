import json
import os

class NOCAgent:
    """
    Agente especializado en el Monitoreo de Red (NOC).
    Capaz de diagnosticar fallos en hosts, analizar alertas y sugerir rutas de reparación.
    """
    
    def __init__(self):
        self.role = "Especialista NOC Xcien"
        self.description = "Monitoreo y diagnóstico de infraestructura de red."

    def analyze_status(self, hosts_data: list, alerts_data: list):
        total = len(hosts_data)
        offline = [h for h in hosts_data if h.get("status") == "offline"]
        critical_alerts = [a for a in alerts_data if a.get("severity") == "critical"]
        
        summary = f"Análisis de Red: {total} dispositivos monitoreados. "
        if offline:
            summary += f"ALERTA: {len(offline)} hosts caídos detectados. "
        if critical_alerts:
            summary += f"Hay {len(critical_alerts)} alertas críticas activas."
            
        return {
            "agent": self.role,
            "status": "warning" if offline or critical_alerts else "stable",
            "summary": summary,
            "offline_hosts": [h["name"] for h in offline],
            "recommendation": "Revisar alimentación en nodos caídos y verificar latencia en sitios afectados." if offline else "Red operando en parámetros normales."
        }

agent_noc = NOCAgent()
