"""
Crea la estructura de proyectos 2026 en ClickUp:
Space → 5 Listas → Tareas por fase
"""
import os, sys, json, time
import urllib.request, urllib.error
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

API_KEY   = os.getenv("CLICKUP_API_KEY")
TEAM_ID   = "90141376562"  # NextVentures
BASE_URL  = "https://api.clickup.com/api/v2"

HEADERS = {
    "Authorization": API_KEY,
    "Content-Type": "application/json",
}

def req(method, path, body=None):
    url  = BASE_URL + path
    data = json.dumps(body).encode() if body else None
    r    = urllib.request.Request(url, data=data, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"  ❌ {method} {path} → {e.code}: {e.read().decode()}")
        return None

# ── Proyectos + fases ──────────────────────────────────────────────────────
# due_date en epoch ms: 2026-07-01 = 1751328000000
BASE_JUL = 1751328000000
MES_MS   = 30 * 24 * 60 * 60 * 1000  # ~30 días en ms

def mes_ts(mes_num):
    """mes_num: 1=Jul, 6=Dic"""
    return BASE_JUL + (mes_num - 1) * MES_MS

PROYECTOS = [
    {
        "nombre": "P1 — Academia XCIEN",
        "color":  "#00A859",
        "fases": [
            ("Diseño curricular 8 áreas",       1, 1),
            ("Creación cursos módulos 1–12",     1, 2),
            ("Creación cursos módulos 13–24",    3, 4),
            ("Evaluaciones y exámenes",          3, 4),
            ("Piloto y ajustes",                 4, 5),
            ("Lanzamiento formal",               5, 5),
            ("Certificaciones y métricas",       5, 6),
        ],
    },
    {
        "nombre": "P2 — Plazas Foráneas",
        "color":  "#0D6EFD",
        "fases": [
            ("Diagnóstico y priorización",       1, 1),
            ("Visitas plazas prioridad alta",    2, 3),
            ("Recuperación nodos offline",       2, 4),
            ("Visitas plazas prioridad media",   3, 4),
            ("Activación comercial",             3, 6),
            ("Seguimiento y métricas",           4, 6),
        ],
    },
    {
        "nombre": "P3 — Fibra Piedras Negras",
        "color":  "#F97316",
        "fases": [
            ("Levantamiento y diseño",           1, 2),
            ("Permisos y gestión municipal",     1, 2),
            ("Obra civil",                       3, 4),
            ("Tendido de fibra",                 4, 5),
            ("Iluminación y equipos activos",    5, 5),
            ("Pruebas OTDR y certificación",     5, 6),
            ("Entrega y primeros clientes",      6, 6),
        ],
    },
    {
        "nombre": "P4 — Tamaulipas Mejora de Red",
        "color":  "#8B5CF6",
        "fases": [
            ("Diagnóstico remoto NOC/SNMP",      1, 1),
            ("Visita Reynosa",                   2, 2),
            ("Visita Tampico",                   2, 3),
            ("Visita Matamoros y Nuevo Laredo",  3, 3),
            ("Plan de mejoras y presupuesto",    3, 4),
            ("Implementación de mejoras",        4, 6),
            ("Seguimiento y recuperación",       4, 6),
        ],
    },
    {
        "nombre": "P5 — iBlack + Cuadrillas.mx",
        "color":  "#06B6D4",
        "fases": [
            ("iBlack: alcance y arquitectura",   1, 1),
            ("iBlack: portal cliente",           1, 2),
            ("iBlack: integración UISP+Odoo",    2, 3),
            ("iBlack: NOC operadores",           3, 3),
            ("iBlack: pruebas y lanzamiento",    3, 4),
            ("Cuadrillas: órdenes y asignación", 2, 3),
            ("Cuadrillas: app móvil técnicos",   3, 4),
            ("Cuadrillas: integración Odoo",     4, 5),
            ("Lanzamiento y cliente piloto",     4, 5),
            ("Estabilización y métricas",        5, 6),
        ],
    },
]

# ── Statuses a crear en cada lista ─────────────────────────────────────────
STATUSES = [
    {"status": "Pendiente",    "color": "#808080", "type": "open"},
    {"status": "En progreso",  "color": "#F59E0B", "type": "open"},
    {"status": "Completada",   "color": "#00A859", "type": "closed"},
    {"status": "Bloqueada",    "color": "#EF4444", "type": "open"},
]

def main():
    print("🚀 Creando estructura XCIEN 2026 en ClickUp…\n")

    # 1. Usar Space ya creado (evitar duplicado)
    EXISTING_SPACE_ID = "90146298766"
    space_id = EXISTING_SPACE_ID
    print(f"   ✅ Space existente reutilizado (id={space_id})\n")
    time.sleep(0.2)

    # IDs de listas ya creadas en el paso anterior
    EXISTING_LIST_IDS = {
        "P1 — Academia XCIEN":          "901417731953",
        "P2 — Plazas Foráneas":         "901417731955",
        "P3 — Fibra Piedras Negras":    "901417731957",
        "P4 — Tamaulipas Mejora de Red":"901417731963",
        "P5 — iBlack + Cuadrillas.mx":  "901417731965",
    }
    ids_out = {"space_id": space_id, "lists": []}

    # 2. Por cada proyecto → crear lista + tareas
    for p in PROYECTOS:
        print(f"📋 Procesando lista: {p['nombre']}")
        list_id = EXISTING_LIST_IDS.get(p["nombre"])
        if not list_id:
            print(f"   ⚠️  ID no encontrado para {p['nombre']}")
            continue
        print(f"   ✅ Lista existente reutilizada (id={list_id})")

        task_ids = []
        for fase, m_ini, m_fin in p["fases"]:
            task = req("POST", f"/list/{list_id}/task", {
                "name": fase,
                "start_date": mes_ts(m_ini),
                "start_date_time": False,
                "due_date": mes_ts(m_fin),
                "due_date_time": False,
                "status": "to do",
                "priority": 3,
            })
            if task:
                task_ids.append({"fase": fase, "id": task["id"]})
                print(f"      ✓ {fase}")
            time.sleep(0.2)

        ids_out["lists"].append({
            "nombre": p["nombre"],
            "list_id": list_id,
            "tasks": task_ids,
        })
        print()

    # 3. Guardar IDs para que el portal los use
    out_path = os.path.join(os.path.dirname(__file__), "clickup_ids.json")
    with open(out_path, "w") as f:
        json.dump(ids_out, f, indent=2, ensure_ascii=False)

    print(f"✅ Estructura creada. IDs guardados en: {out_path}")
    print(f"\n🔗 Abre ClickUp → Space 'XCIEN — Plan de Trabajo 2026' para verificar.")


if __name__ == "__main__":
    main()
