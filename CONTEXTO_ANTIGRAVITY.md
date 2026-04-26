# Contexto del Proyecto — Live Status Hub XCIEN
> Briefing para Antigravity · Actualizado 2026-04-25

---

## ¿Qué es este proyecto?

**Live Status Hub** es la plataforma operativa unificada de XCIEN — una empresa ISP que opera 5 operadoras:
XCIEN, Wispi, Luminet WAN, Huus y Sandur, con presencia en Nuevo León, CDMX, Jalisco, Coahuila y San Luis Potosí.

**Repositorio GitHub:** https://github.com/jmmcmx/live-status-hub  
**Carpeta local:** `/Users/mesquite/Desktop/Live status Xcien/`

---

## Arquitectura del sistema

```
live-status-hub/             ← Fuente única de verdad
├── src/                     ← Frontend React + TypeScript + Vite + Tailwind + Supabase
├── backend/                 ← Agentes Python (FastAPI en puerto 8000)
│   ├── agents/
│   │   └── director_general_v2.py   ← Agente IA con Claude + prompt caching
│   ├── servidor_academia.py         ← Servidor FastAPI principal
│   ├── db/wfm_data.json             ← Técnicos y tickets (persistente)
│   ├── db/skills_2026.json          ← Matriz de habilidades
│   ├── banco_preguntas.json         ← Exámenes de Academia
│   └── .env                         ← ANTHROPIC_API_KEY (no subir a git)
└── docs/                    ← Archivo de auditoría operativa ene–abr 2026
    ├── auditoria_2026/      ← Entrega-recepción, libro maestro, estado del sistema
    ├── estandares/          ← Estándares técnicos (fuente para exámenes de Academia)
    ├── capacitacion/        ← Manual de operaciones, bitácora
    └── reportes/            ← Informes técnicos y reportes de campo
```

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Estado | TanStack Query + React hooks |
| Base de datos | Supabase (PostgreSQL) |
| Backend | FastAPI (Python 3.9) en puerto 8000 |
| IA | Claude (Anthropic) con prompt caching activo |
| PDFs | jsPDF + jspdf-autotable |

---

## Módulos del frontend (http://localhost:8080)

| Página | Ruta | Descripción |
|---|---|---|
| NOC | `/` | Centro de control de red en tiempo real |
| Red en Vivo | `/red-en-vivo` | Vista holográfica del estado de red |
| Dispatch | `/dispatch` | Despacho de técnicos de campo |
| Gerencia | `/gerencia` | Dashboard ejecutivo |
| Academia | `/academia` | Capacitación, exámenes y leaderboard |
| Reportes Gobierno | `/reportes-gobierno` | SLA y cumplimiento |
| Reporte de Impacto | `/reporte-impacto` | Análisis de impacto operativo |
| **XCIEN 2.0** | `/xcien2` | Centro de comando maestro con IA |

---

## Backend API (http://localhost:8000)

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/health` | GET | Estado del servidor |
| `/api/director/chat` | POST | Chat con Director General IA (Claude) |
| `/api/wfm/tecnicos` | GET | Lista de técnicos de campo |
| `/api/wfm/tickets` | GET | Tickets activos |
| `/api/wfm/asignar/{id}` | POST | Auto-asignar ticket a técnico |
| `/api/wfm/tecnico/{id}/status` | PUT | Actualizar estado de técnico |
| `/api/diagnostic_exam` | GET | Banco de preguntas de diagnóstico |
| `/api/generate_quiz` | POST | Generar examen desde estándar .md con Ollama |
| `/api/docs` | GET | Listar manuales disponibles |
| `/api/odoo/tecnicos` | GET | Técnicos reales desde Odoo ERP |

---

## Cómo levantar el sistema

```bash
# Terminal 1 — Frontend
cd "/Users/mesquite/Desktop/Live status Xcien"
npm run dev        # http://localhost:8080

# Terminal 2 — Backend
cd "/Users/mesquite/Desktop/Live status Xcien/backend"
python3 servidor_academia.py   # http://localhost:8000
```

---

## Estado actual del sistema (2026-04-25)

- ✅ Frontend corriendo en localhost:8080
- ✅ Backend FastAPI corriendo en localhost:8000
- ✅ Director General IA conectado a Claude con prompt caching (~80% ahorro)
- ✅ WFM (técnicos + tickets) persistente en backend/db/wfm_data.json
- ✅ Documentación de auditoría preservada en docs/ (solo lectura)
- ✅ .env protegido — no sube a GitHub

---

## Datos del sistema

- **Técnicos activos:** 6 (Carlos Mendoza, Ana Rodríguez, Miguel Ángel Torres, Laura Garza, Roberto Salinas, Jorge Martínez)
- **Plazas:** Nuevo León, Coahuila, San Luis Potosí, CDMX, Jalisco
- **Tickets activos:** 5 (T-1042 a T-1046)
- **Estándares técnicos:** 4 documentos en docs/estandares/ (fuente de exámenes Academia)

---

## Lo que falta / próximos pasos sugeridos

- [ ] Conectar módulo Academia a `/api/diagnostic_exam` y `/api/generate_quiz`
- [ ] Instalar Ollama local para generación de exámenes sin costo
- [ ] Conectar a Odoo ERP real con credenciales en `.env`
- [ ] Integrar Supabase para datos en tiempo real del NOC
- [ ] Desplegar en producción (Netlify para frontend, VPS para backend)
