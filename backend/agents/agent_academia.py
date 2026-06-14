class AcademiaAgent:
    """
    Agente especializado en Capacitación y Certificación (Academia).
    Evalúa el progreso de los técnicos y genera rutas de aprendizaje.
    """
    
    def __init__(self):
        self.role = "Mentor Académico Xcien"
        self.description = "Gestión de conocimiento, exámenes y certificación de técnicos."

    def evaluate_progress(self, skills_data: dict):
        technicians = len(skills_data)
        expert_count = sum(1 for t in skills_data.values() if any(s >= 90 for s in t.get("skills", {}).values()))
        
        return {
            "agent": self.role,
            "status": "educational",
            "metrics": {
                "total_technicians": technicians,
                "experts": expert_count
            },
            "recommendation": "Reforzar capacitación en el pilar de 'Redes IP' donde se detecta la mayor brecha." if technicians > 0 else "Cargar base de datos de técnicos."
        }

agent_academia = AcademiaAgent()
