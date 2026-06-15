import os
import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))


class Agent:
    def __init__(self, name, role):
        self.name = name
        self.role = role
        print(f"[{self.name}] Inicializado. Rol: {self.role[:60]}...")

    def delegate_task(self, task, target_agent):
        print(f"\n🧠 [{self.name}] delegando a [{target_agent.name}]...")
        print(f"   -> Tarea: '{task}'")
        return target_agent.process_task(task)

    def process_task(self, task):
        print(f"⏳ [{self.name}] procesando con Claude...")
        try:
            message = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=1024,
                system=f"""Eres un experto con el siguiente rol en Xcien (empresa ISP mexicana):
Nombre: {self.name}
Rol: {self.role}

Xcien opera 5 operadoras: XCIEN, Wispi, Luminet WAN, Huus y Sandur.
Respondes en español, de forma profesional y concisa.""",
                messages=[{"role": "user", "content": task}]
            )
            respuesta = message.content[0].text
            print(f"✅ [{self.name}] Tarea completada.")
            return f"[{self.name}]:\n{respuesta}"
        except Exception as e:
            return f"⚠️ [{self.name}] Error: {e}"


class DirectorGeneral(Agent):
    def __init__(self, workers):
        super().__init__(
            name="Director General",
            role="Director General y Orquestador de Operaciones Xcien"
        )
        self.workers = workers

    def handle_user_command(self, command):
        print("=" * 45)
        print(f"👤 USUARIO: {command}")
        print("=" * 45)

        cmd = command.lower()

        if any(w in cmd for w in ["seguridad", "campo", "epp", "instalación", "técnico"]):
            target, task = self.workers["operaciones"], f"Ejecuta esta acción de campo: '{command}'"
        elif any(w in cmd for w in ["capacitación", "curso", "academia", "examen", "manual"]):
            target, task = self.workers["RRHH"], f"Crea o coordina esto para Academia Xcien: '{command}'"
        elif any(w in cmd for w in ["odoo", "erp", "módulo", "ticket", "registro"]):
            target, task = self.workers["odoo"], f"Resuelve este requerimiento en Odoo wispi17: '{command}'"
        elif any(w in cmd for w in ["asignar", "ruta", "despacho", "agenda", "dispatch"]):
            target, task = self.workers["dispatch"], f"Coordina la logística: '{command}'"
        elif any(w in cmd for w in ["caído", "enlace", "noc", "monitoreo", "nodo", "red", "falla"]):
            target, task = self.workers["noc"], f"Analiza y escala si es necesario: '{command}'"
        elif any(w in cmd for w in ["venta", "comercial", "cotización", "prospecto", "cliente"]):
            target, task = self.workers["comercial"], f"Gestiona este requerimiento comercial: '{command}'"
        elif any(w in cmd for w in ["factibilidad", "preventa", "coordenadas", "antena", "señal"]):
            target, task = self.workers["preventa"], f"Realiza el análisis de factibilidad: '{command}'"
        elif any(w in cmd for w in ["contrato", "legal", "renta", "arrendamiento", "ift", "regulación", "cláusula", "proveedor"]):
            target, task = self.workers["legal"], f"Asesora sobre este tema legal: '{command}'"
        else:
            return "No identifiqué el departamento destino. Por favor sé más específico."

        respuesta = self.delegate_task(task, target)
        print(f"\n✅ [{self.name}] Delegación completada.")
        return respuesta


if __name__ == "__main__":
    agente_operaciones = Agent("Agente de Operaciones", "Supervisor de Campo — Checklists, EPP y Field Service Management")
    agente_rrhh       = Agent("Agente RRHH/Academia",  "Diseñador Instruccional y Gestor de Capacitaciones Xcien")
    agente_odoo       = Agent("Agente Odoo",           "Consultor Senior en Odoo 17 ERP (Python/XML/PostgreSQL) — base wispi17")
    agente_dispatch   = Agent("Agente Dispatch",       "Coordinador de Logística y Despacho de Técnicos de Campo")
    agente_noc        = Agent("Agente NOC",            "Analista de Network Operations Center y Monitoreo de Red")
    agente_comercial  = Agent("Agente Comercial",      "Especialista en Ventas, CRM y Atención a Clientes ISP")
    agente_preventa   = Agent("Agente Preventa",       "Analista Técnico de Factibilidad, Coordenadas y Diseño de Soluciones")
    agente_legal      = Agent("Agente Legal",          """Asesor Legal en Telecomunicaciones México.
Especialista en: contratos de arrendamiento de sitios, proveedores de equipo (Cambium/Mikrotik/Ubiquiti),
marco IFT/SCT, contratos SIDP, NDA, SLA y penalizaciones. Siempre recomienda validar con abogado certificado.""")

    equipo = {
        "operaciones": agente_operaciones,
        "RRHH":        agente_rrhh,
        "odoo":        agente_odoo,
        "dispatch":    agente_dispatch,
        "noc":         agente_noc,
        "comercial":   agente_comercial,
        "preventa":    agente_preventa,
        "legal":       agente_legal,
    }

    director = DirectorGeneral(workers=equipo)

    print("\n" + "=" * 45)
    print("   SIMULADOR DE AGENTES XCIEN (Claude AI)   ")
    print("=" * 45 + "\n")

    casos = [
        "Necesito preparar el curso de capacitación de mañana",
        "Los técnicos van a campo, revisa seguridad del mástil",
        "NOC reporta que el nodo de zona industrial perdió enlace troncal",
        "El rentero quiere subir el precio del arrendamiento de la azotea donde tenemos una antena",
    ]

    for caso in casos:
        resp = director.handle_user_command(caso)
        print(resp)
        print("\n" + "-" * 45 + "\n")
