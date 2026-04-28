class FinanceAgent:
    """
    Agente especializado en Finanzas e Intercompany (Tokens & Transacciones).
    Asegura que los flujos financieros entre empresas del grupo sean correctos.
    """
    
    def __init__(self):
        self.role = "Analista de Finanzas Intragrupo"
        self.description = "Control de transacciones entre empresas, emisión de tokens y auditoría financiera."

    def review_transactions(self, transactions: list, tokens: list):
        total_volume = sum(t.get("precio_preferencial", 0) for t in transactions)
        pending_tokens = [tok for tok in tokens if tok.get("status") == "pending"]
        
        return {
            "agent": self.role,
            "status": "monitored",
            "finance_kpis": {
                "transaction_volume": total_volume,
                "active_tokens": len(tokens),
                "pending_validation": len(pending_tokens)
            },
            "recommendation": "Validar los tokens pendientes de Odoo para asegurar la facturación intercompany."
        }

agent_finances = FinanceAgent()
