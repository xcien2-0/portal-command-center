# 🗂️ ESTADO DEL SISTEMA — XCIEN 2.0
> Última actualización automática: 2026-04-23  
> Este documento es la fuente de verdad para todos los agentes e IAs del proyecto.

---

## 🏗️ ARQUITECTURA ACTUAL

```
XCIEN 2.0 Portal
├── servidor_academia.py   ← FastAPI, puerto 8000 — PUNTO DE ENTRADA ÚNICO
├── director_general_v2.py ← Agente Claude (claude-sonnet-4-6) — Orquestador del chat
├── simulador_agentes.py   ← 8 Agentes Claude Haiku — CLI y automatización
├── creador_manuales.py    ← Generador de documentos Markdown con Claude
├── static/
│   ├── index.html         ← Dashboard Master (sidebar SPA)
│   ├── style.css          ← Diseño premium dark mode
│   ├── app.js             ← Lógica: NOC, WFM, Biblioteca, Exámenes, Chat
│   ├── dashboard_ui.jsx   ← React: Academia slideshow (Babel standalone)
│   └── red-en-vivo.jsx    ← React: NOC holográfico en tiempo real
├── db/
│   ├── wfm_data.json      ← 5 técnicos + 3 tickets (fuente de verdad WFM)
│   └── skills_2026.json   ← Matriz de habilidades de técnicos
├── Xcien_Docs/            ← 6 manuales técnicos .md
│   └── quizzes/           ← Caché de exámenes generados por IA
└── banco_preguntas.json   ← Examen diagnóstico maestro 2026
```

---

## 👥 MAPA DE AGENTES

| Capa | Agente | Modelo | Función |
|------|--------|--------|---------|
| **Humano** | Miguel Macías | — | Director General Humano / Usuario |
| **Ingeniero** | Antigravity | Gemini/Claude | Escribe código, ejecuta comandos, orquesta el sistema |
| **Portal** | DirectorGeneralV2 | claude-sonnet-4-6 | Responde en el chat del portal. Lee WFM + Libro Maestro |
| **CLI** | DirectorGeneral (simulador) | claude-haiku-4-5 | Orquesta los 8 agentes desde terminal |
| **Agentes** | Operaciones | claude-haiku-4-5 | Campo, EPP, checklists |
| **Agentes** | RRHH/Academia | claude-haiku-4-5 | Capacitaciones, exámenes |
| **Agentes** | Odoo ERP | claude-haiku-4-5 | wispi17, módulos Odoo 17 |
| **Agentes** | Dispatch | claude-haiku-4-5 | Logística y despacho |
| **Agentes** | NOC | claude-haiku-4-5 | Monitoreo de red |
| **Agentes** | Comercial | claude-haiku-4-5 | Ventas, CRM |
| **Agentes** | Preventa | claude-haiku-4-5 | Factibilidad técnica |
| **Agentes** | Legal | claude-haiku-4-5 | Contratos, IFT, SLA |

---

## 🌐 MÓDULOS DEL PORTAL (localhost:8000)

| Módulo | Sección | Estado | Descripción |
|--------|---------|--------|-------------|
| **Inicio** | Chat DG | ✅ Funcional | Chat con DirectorGeneralV2 (Claude) |
| **NOC** | Red en Vivo | ✅ Integrado | `red-en-vivo.jsx` — 10 nodos, alertas, vista Gerencial/Operador |
| **WFM** | Control | ✅ Funcional | 5 técnicos, 3 tickets, auto-asignación por skill |
| **Biblioteca** | Manuales | ✅ Funcional | 6 documentos, búsqueda, visor Markdown |
| **Academia** | Exámenes | ✅ Funcional | Generación con Ollama (llama3.2:3b), caché local |
| **Academia** | Dashboard | ✅ Funcional | Slideshow React: niveles, badges, leaderboard |

---

## 🔌 API ENDPOINTS

| Método | Ruta | Función |
|--------|------|---------|
| GET | `/api/docs` | Lista manuales |
| GET | `/api/docs/{filename}` | Contenido de manual |
| POST | `/api/generate_quiz` | Genera examen con Ollama IA |
| GET | `/api/diagnostic_exam` | Examen diagnóstico maestro |
| POST | `/api/save_skill_result` | Guarda matriz de habilidades |
| GET | `/api/wfm/tecnicos` | Lista técnicos de campo |
| GET | `/api/wfm/tickets` | Lista tickets activos |
| POST | `/api/wfm/asignar/{id}` | Auto-asigna técnico a ticket |
| PUT | `/api/wfm/tecnico/{id}/status` | Actualiza estatus técnico |
| POST | `/api/director/chat` | Chat con Director General IA |

---

## ⚙️ VARIABLES DE ENTORNO (.env)

```
ANTHROPIC_API_KEY=sk-ant-...   # Claude (Director General + Agentes)
GEMINI_API_KEY=...             # Legado (no en uso activo)
ODOO_URL=https://odoo.wispi.mx
ODOO_DB=wispi17
ODOO_USER=miguel.macias@xcien.com
OLLAMA_MODEL=llama3.2:3b       # Generación de exámenes (local, sin costo)
```

---

## 🚀 CÓMO ARRANCAR

```bash
cd /Users/mesquite/Antigravity
lsof -ti :8000 | xargs kill -9  # Limpiar puerto si es necesario
python3 servidor_academia.py     # Inicia en http://localhost:8000
```

---

## 📋 DATOS DE CAMPO (WFM)

**Técnicos:** Erik Silva, Jhony Collazo, Rogelio Hernández, José Macías, Pablo Reyes  
**Plazas:** Monterrey NL, Jalisco, CDMX, Querétaro  
**Tickets activos:** 3 (1 Agendado, 1 Pendiente, 1 En Progreso)

---

## 🏢 CONTEXTO CORPORATIVO XCIEN

- **Empresa:** ISP (Internet Service Provider) mexicano
- **Operadoras:** XCIEN, Wispi, Luminet WAN, Huus, Sandur
- **Técnicos de campo:** 47 activos, 6 plazas
- **ERP:** Odoo 17 — base `wispi17` (FUENTE DE VERDAD ÚNICA)
- **Objetivo 2026:** Profesionalización total de operaciones (Academia + WFM + NOC integrados)

---

## 📌 REGLAS DE COORDINACIÓN ENTRE IAs

1. **Antigravity** es el Ingeniero. Escribe y repara código. No toma decisiones operativas.
2. **DirectorGeneralV2** (portal) es el agente de inteligencia operativa. Responde con datos reales de WFM.
3. **SimuladorAgentes** (CLI) delega a los 8 agentes especializados según palabras clave.
4. Cualquier IA que tome este contexto debe **verificar el estado actual del servidor** antes de hacer cambios.
5. El archivo `ESTADO_SISTEMA.md` es la fuente de verdad. Actualizarlo en cada cambio mayor.
