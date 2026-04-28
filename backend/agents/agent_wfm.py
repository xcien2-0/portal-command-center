import json

class WFMAgent:
    """
    Agente especializado en Control Operativo (WFM).
    Gestiona el flujo de órdenes desde preventa hasta instalación.
    """
    
    def __init__(self):
        self.role = "Coordinador de Operaciones WFM"
        self.description = "Gestión de fuerza de trabajo y flujo de órdenes de servicio."

    def optimize_workflow(self, orders: list):
        backlog = [o for o in orders if o.get("estado") == "BACKLOG"]
        in_almacen = [o for o in orders if o.get("estado") == "ALMACEN_VALIDACION"]
        
        summary = f"Estado Operativo: {len(orders)} órdenes en curso. "
        if backlog:
            summary += f"ATENCIÓN: {len(backlog)} órdenes en backlog requieren intervención. "
        
        return {
            "agent": self.role,
            "status": "active",
            "kpis": {
                "total_orders": len(orders),
                "in_almacen": len(in_almacen),
                "critical_backlog": len(backlog)
            },
            "recommendation": "Acelerar validación en almacén para órdenes prioritarias." if in_almacen else "Flujo de trabajo estable."
        }

agent_wfm = WFMAgent()
