import json
import os
from datetime import datetime

class OdooAuditor:
    def __init__(self, db_path="db/audit_log.json"):
        self.db_path = db_path
        if not os.path.exists(os.path.dirname(db_path)):
            os.makedirs(os.path.dirname(db_path))

    def run_daily_audit(self, daily_tasks):
        """
        Analiza una lista de tareas de Odoo y detecta incumplimientos.
        daily_tasks: Lista de diccionarios con la info de la tarea.
        """
        incumplimientos = []
        
        for task in daily_tasks:
            reasons = []
            
            # Regla 1: Checklist Completo
            if task.get("checklist_progress", 0) < 100:
                reasons.append(f"Checklist incompleto ({task['checklist_progress']}%)")
            
            # Regla 2: Hoja de Trabajo Completa
            if not task.get("worksheet_complete", False):
                reasons.append("Hoja de trabajo sin materiales/consumibles")
            
            # Regla 3: Set de Fotos (Mínimo 4: Antena, Mastil, Router, Speedtest)
            if task.get("photo_count", 0) < 4:
                reasons.append(f"Evidencia insuficiente ({task['photo_count']}/4 fotos)")
            
            # Regla 4: Firma de Conformidad
            if not task.get("has_signature", False):
                reasons.append("Falta firma de conformidad del cliente")

            if reasons:
                incumplimientos.append({
                    "id": task["id"],
                    "tecnico": task["tecnico"],
                    "fallas": reasons,
                    "link": f"https://xcien.odoo.com/web#id={task['id']}&model=project.task"
                })
        
        return incumplimientos

    def generate_report(self, incumplimientos):
        """Genera un archivo Markdown con el reporte consolidado."""
        report_path = "Xcien_Docs/reporte_supervisor_diario.md"
        today = datetime.now().strftime("%Y-%m-%d")
        
        content = f"# 📋 Reporte de Auditoría de Calidad - {today}\n\n"
        content += "Este reporte detalla las tareas cerradas que no cumplen con los estándares corporativos de documentación de Xcien.\n\n"
        
        if not incumplimientos:
            content += "✅ **Felicidades: Todas las tareas del día cumplieron con el estándar.**\n"
        else:
            content += "| ID Tarea | Técnico | Hallazgos (Faltantes) | Enlace Odoo |\n"
            content += "| :--- | :--- | :--- | :--- |\n"
            for item in incumplimientos:
                fallas_str = "; ".join(item["fallas"])
                content += f"| {item['id']} | **{item['tecnico']}** | {fallas_str} | [Ver Tarea]({item['link']}) |\n"
        
        content += f"\n\n---\n*Generado automáticamente por el Agente Auditor de Xcien a las {datetime.now().strftime('%H:%M')}*"
        
        with open(report_path, "w", encoding="utf-8") as f:
            f.read() if False else f.write(content)
            
        return report_path

if __name__ == "__main__":
    # Simulación de tareas del día cargadas de Odoo
    tasks_to_audit = [
        {
            "id": "TASK-2026-001",
            "tecnico": "Jhony Collazo",
            "checklist_progress": 100,
            "worksheet_complete": True,
            "photo_count": 5,
            "has_signature": True
        },
        {
            "id": "TASK-2026-002",
            "tecnico": "Erik Alberto",
            "checklist_progress": 80,
            "worksheet_complete": True,
            "photo_count": 2,
            "has_signature": False
        },
        {
            "id": "TASK-2026-003",
            "tecnico": "Rogelio",
            "checklist_progress": 100,
            "worksheet_complete": False,
            "photo_count": 4,
            "has_signature": True
        }
    ]
    
    auditor = OdooAuditor()
    results = auditor.run_daily_audit(tasks_to_audit)
    report = auditor.generate_report(results)
    print(f"✅ Auditoría completada. Reporte generado en: {report}")
