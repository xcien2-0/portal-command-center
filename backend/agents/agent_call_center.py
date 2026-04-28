class CallCenterAgent:
    """
    Agente especializado en Atención al Cliente (Centro de Mando).
    Orquesta la atención entre bots e humanos y gestiona escalaciones.
    """
    
    def __init__(self):
        self.role = "Supervisor de Centro de Mando"
        self.description = "Gestión de comunicaciones, escalaciones y experiencia del cliente."

    def monitor_conversations(self, conversations: list):
        escalated = [c for c in conversations if c.get("status") == "escalated"]
        bot_active = [c for c in conversations if c.get("status") == "bot_active"]
        
        summary = f"Centro de Mando: {len(conversations)} conversaciones activas. "
        if escalated:
            summary += f"URGENTE: {len(escalated)} conversaciones requieren un agente humano inmediatamente."
            
        return {
            "agent": self.role,
            "status": "alert" if escalated else "normal",
            "active_metrics": {
                "total": len(conversations),
                "human_required": len(escalated),
                "ai_handled": len(bot_active)
            },
            "recommendation": "Asignar personal a las conversaciones escaladas desde WhatsApp/Net2Phone." if escalated else "Nivel de servicio óptimo."
        }

agent_call_center = CallCenterAgent()
