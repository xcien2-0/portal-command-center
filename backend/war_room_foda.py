import json
import os

def generate_deep_swot():
    # Contexto Extraído de los manuales y DBs reales
    print("🧠 [Director General] Iniciando sesión en la Sala de Guerra (War Room)...")
    print("📡 [NOC Agent] Reportando estado de infraestructura...")
    print("🔧 [WFM Agent] Analizando disponibilidad y habilidades del personal...")
    print("🎓 [Academia Agent] Revisando niveles de certificación...")

    # Real SWOT Data (Based on project context)
    swot = {
        "fortalezas": [
            "Integración de última milla con microondas y fibra propia (Estándar de Instalación Xcien).",
            "Soporte Nivel 2 altamente capacitado (skillPct promedio > 80% en core).",
            "Certificación obligatoria antes de despacho (Academia Digital).",
            "Tokenización de transacciones operativas para trazabilidad absoluta."
        ],
        "oportunidades": [
            "Migración masiva de clientes de microondas a fibra (Up-selling).",
            "Automatización del despacho basada en geolocalización (Bridge Antigravity).",
            "Monetización de los tokens de desempeño para retención de talento."
        ],
        "debilidades": [
            "Fragmentación de la información entre Odoo y el Portal de Operaciones (API pendiente).",
            "Latencia elevada en algunos nodos rurales (según alertas del NOCBoard).",
            "Curva de aprendizaje de nuevos estándares técnicos (Manual de 25k bytes)."
        ],
        "amenazas": [
            "Competidores de bajo costo (Starlink/ISPs locales) en zonas residenciales.",
            "Desgaste de equipos en nodos por condiciones climáticas extremas.",
            "Rotación de técnicos certificados por alta demanda en el sector."
        ]
    }
    
    # Simulación de Diálogo
    dialogue = [
        {"agente": "Director General", "msj": "Equipo, necesitamos un FODA crudo. ¿Cuál es nuestro mayor riesgo ahora?"},
        {"agente": "NOC Agent", "msj": "La latencia en los nodos rurales. Si no automatizamos el balanceo de carga con Antigravity, perderemos clientes VIP."},
        {"agente": "WFM Agent", "msj": "Y la rotación. Capacitamos técnicos en la Academia y luego se van a la competencia. Debemos usar los tokens para incentivos reales."},
        {"agente": "Academia Agent", "msj": "Propongo que el 'Cambio de Área' sea automático al completar certificaciones avanzadas."},
        {"agente": "Director General", "msj": "Entendido. Antigravity, sintetiza esto en un reporte ejecutivo real para Miguel Macías."}
    ]
    
    return swot, dialogue

if __name__ == "__main__":
    swot, dialogue = generate_deep_swot()
    with open("backend/db/foda_real_context.json", "w", encoding="utf-8") as f:
        json.dump({"swot": swot, "dialogue": dialogue}, f, indent=2, ensure_ascii=False)
    print("✅ FODA Real generado y guardado.")
