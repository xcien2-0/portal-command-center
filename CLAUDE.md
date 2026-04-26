# live-status-hub

## Qué es este proyecto
App web de Academia XCIEN para técnicos de campo — gamificación con XP, niveles, módulos de capacitación y exámenes.

## Stack
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- **Odoo wispi17** como fuente de datos (Supabase fue eliminado)

## Páginas principales
| Ruta | Archivo | Descripción |
|---|---|---|
| `/academia` | `AcademiaDashboard.tsx` | Dashboard con XP, nivel, racha, leaderboard |
| `/academia/modulos` | `AcademiaModulos.tsx` | Módulos de capacitación con bloqueo por nivel |
| `/academia/examenes` | `AcademiaExamenes.tsx` | Exámenes con feedback por pregunta |
| `/academia/perfil` | — | Perfil del técnico |
| `/academia/leaderboard` | — | Ranking por plaza |
| `/academia/admin` | — | Panel supervisor |

## Contexto compartido
`AcademiaLayout.tsx` provee el contexto del técnico activo via `useAcademia()`.
Selector de técnico en el header (modo demo — en producción conectar a Odoo).

## Sistema de XP y niveles
Definido en `src/lib/academia-utils.ts`:
- Niveles 1–5 con colores y nombres
- XP por módulo completado, examen aprobado (1er intento vs reintento)
- `xp_log` registra cada evento

## Conexión con XCIEN 2.0
- El backend de agentes vive en `github.com/jmmcmx/XCIEN2.0`
- `servidor_academia.py` expone la API en puerto 8000
- Remote Trigger "antigravity" (`trig_01A1VdoN9yfwyoUFWChXbn3g`) es el Director General

## Para correr
```bash
npm run dev   # puerto 5173
```
