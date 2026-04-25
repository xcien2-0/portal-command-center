# Live Status Hub — XCIEN

Plataforma operativa unificada de XCIEN. Fuente absoluta de verdad del sistema.

## Estructura del repositorio

```
live-status-hub/
├── src/                     ← Frontend React + TypeScript (Vite)
│   ├── pages/               ← NOC, Dispatch, Gerencia, Academia, Red en Vivo, Reportes
│   ├── components/          ← Componentes UI reutilizables
│   ├── data/                ← Mock data + quizzes JSON de Academia
│   ├── integrations/        ← Cliente Supabase
│   └── utils/               ← Generación de PDFs
│
├── backend/                 ← Agentes Python (sistema multi-agente XCIEN)
│   ├── agents/              ← Director General, Auditor, Agente Claude, Simulador
│   ├── servidor_academia.py ← Servidor de la Academia (Flask)
│   ├── scratch_odoo*.py     ← Integración con Odoo ERP
│   ├── reporte_monterrey.py ← Generación de reportes de campo
│   └── requirements.txt     ← Dependencias Python
│
└── docs/                    ← Archivo de auditoría operativa (ene–abr 2026)
    ├── auditoria_2026/      ← Entrega-recepción, libro maestro, estado del sistema
    ├── estandares/          ← Estándares de instalación, implementación y soporte HL
    ├── capacitacion/        ← Manual de operaciones, bitácora, protocolo de promoción
    ├── reportes/            ← Informes técnicos y reportes de campo
    └── logs/                ← Logs históricos del servidor
```

## Frontend (React)

```bash
npm install
npm run dev       # Servidor local en http://localhost:8080
npm run build     # Build de producción
```

## Backend (Python)

```bash
cd backend
pip install -r requirements.txt
python servidor_academia.py   # Levanta el servidor de Academia
```

Variables de entorno necesarias (crear `.env` en `backend/`):
```
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
ODOO_URL=
ODOO_DB=
ODOO_USER=
ODOO_PASSWORD=
```

## Módulos del frontend

| Página | Ruta | Descripción |
|--------|------|-------------|
| NOC | `/` | Centro de control de red en tiempo real |
| Red en Vivo | `/red-en-vivo` | Vista holográfica del estado de red |
| Dispatch | `/dispatch` | Despacho de técnicos de campo |
| Gerencia | `/gerencia` | Dashboard ejecutivo |
| Academia | `/academia` | Capacitación y evaluaciones técnicas |
| Reportes Gobierno | `/reportes-gobierno` | Reportes de SLA y cumplimiento |
| Reporte de Impacto | `/reporte-impacto` | Análisis de impacto operativo |
| XCIEN 2.0 | `/xcien2` | Centro de comando maestro |

## Docs — Archivo de auditoría

La carpeta `docs/` contiene la documentación generada durante la auditoría operativa
realizada de enero a abril de 2026. Estos archivos son de solo lectura y representan
el estado del sistema al momento de la entrega-recepción.
