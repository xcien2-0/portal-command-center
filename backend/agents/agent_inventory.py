class InventoryAgent:
    """
    Agente especializado en Inventario y Activos.
    Controla la trazabilidad de equipos, sites y números de serie.
    """
    
    def __init__(self):
        self.role = "Gestor de Activos e Inventario"
        self.description = "Control de stock, auditoría de activos y logística de red."

    def audit_assets(self, assets: list):
        total = len(assets)
        rented = sum(1 for a in assets if a.get("regimen") == "RENTADO")
        
        return {
            "agent": self.role,
            "status": "ready",
            "inventory_report": {
                "total_items": total,
                "rented_equipment": rented,
                "own_equipment": total - rented
            },
            "recommendation": "Realizar auditoría física en Site Monterrey para validar números de serie."
        }

agent_inventory = InventoryAgent()
