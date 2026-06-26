# XCIEN 2.0 — Command Center

Portal de operaciones unificado para XCIEN Networks. Centraliza NOC, campo (WFM), inventario, ventas, RRHH, academia, estrategia y agentes de IA en una sola interfaz.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite (puerto 8080) |
| Backend | FastAPI Python (puerto 8002) |
| Estilos | Tailwind CSS + shadcn/ui |
| Datos | Odoo wispi17 — ERP principal |
| Monitoreo | Observium (NOC) + NOCBoard (energía SNMP) |
| IA | Claude Sonnet · Perplexity · LiteLLM · Ollama |

---

## Instalación rápida

### 1. Requisitos previos

- Node.js 20+
- Python 3.11+
- Git

### 2. Clonar y configurar

```bash
git clone https://github.com/jmmcmx/portal-command-center.git
cd portal-command-center

# Variables de entorno
cp .env.example .env
# Editar .env con los valores reales (ver sección Variables de entorno)
```

### 3. Frontend

```bash
npm install
npm run dev          # Dev en http://localhost:8080
npm run build        # Build de producción → dist/
```

### 4. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Iniciar backend
python servidor_academia.py        # Puerto 8002
```

### 5. Producción con PM2

```bash
pm2 start ecosystem.config.cjs
pm2 status
pm2 logs
pm2 restart all
```

---

## Variables de entorno

Copia `.env.example` como `.env` y completa:

| Variable | Descripción | Requerida |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude API (IA + Antigravity Director) | ✅ |
| `ODOO_URL` | URL del servidor Odoo | ✅ |
| `ODOO_DB` | Base de datos Odoo | ✅ |
| `ODOO_USER` | Usuario XML-RPC Odoo | ✅ |
| `ODOO_PASSWORD` | Contraseña Odoo | ✅ |
| `TOKEN_SECRET` | JWT tokens internos (`openssl rand -hex 32`) | ✅ |
| `OBSERVIUM_URL` | NOC Observium | Recomendada |
| `OBSERVIUM_USER` / `PASS` | Credenciales Observium | Recomendada |
| `NOCBOARD_API_BASE` | NOCBoard energía SNMP | Recomendada |
| `NOCBOARD_API_KEY` | API key NOCBoard | Recomendada |
| `TELEGRAM_BOT_TOKEN` | Bot de alertas | Opcional |
| `TELEGRAM_CHAT_ID` | Chat de destino Telegram | Opcional |
| `GOOGLE_CLIENT_ID` / `SECRET` | OAuth Google Calendar | Opcional |
| `PERPLEXITY_API_KEY` | Supercerebro — Perplexity | Opcional |
| `LITELLM_API_KEY` | Supercerebro — LiteLLM gateway | Opcional |
| `ADMIN_PIN` | PIN Super Admin (default: `xcien2030`) | Opcional |
| `PORT` | Puerto del backend (default: `8002`) | Opcional |

---

## Secciones del portal

### Operaciones (datos reales — Odoo + Observium)
| Sección | Descripción |
|---|---|
| NOC Virtual | Alertas Observium en tiempo real · polling 30s · MTR vía SSE |
| Mapa de Red | Leaflet + dispositivos NOC geocodificados |
| Campo WFM | Tickets Odoo CAST · Kanban · comentarios |
| Cuadrillas | Mapa de técnicos con geocodificación en tiempo real |
| Inventario | Stock Odoo · scanner QR · etiquetas |
| Transferencias | Tránsito de inventario entre almacenes |

### Administración (datos reales)
| Sección | Descripción |
|---|---|
| Ventas / MRR | Órdenes y MRR desde Odoo |
| RRHH | Directorio de empleados y organigrama |
| Sala de Juntas | Agenda Odoo + Google Calendar |
| Bot de Alarmas | Gestión del bot Telegram |
| Documentos | Repositorio de docs internos |
| Reporte PDF NOC | Generación de reporte semanal vía backend |

### Planeación
| Sección | Descripción |
|---|---|
| Estrategia 2030 | Ruta De WISP a TechCo · 7 objetivos · 3 fases |
| Análisis FODA | Estratégico (contenido estático) |
| Tablero de Proyectos | Seguimiento de iniciativas |

### Infraestructura IA
| Sección | Descripción |
|---|---|
| 🧠 Supercerebro | Hub multi-proveedor: Claude · LiteLLM · Ollama · Perplexity · Antigravity Director · contexto operativo plug & play |
| Agentes IA | Chat con agentes especializados via Claude |
| Data Bridge | Terminal de ejecución multi-agente |
| Terminal Móvil | Acceso QR desde dispositivos móviles |

### Sistema
| Sección | Descripción |
|---|---|
| 🔐 Super Admin | Dashboard de uso con PIN · analytics de secciones · actividad diaria |
| Configuración | Temas, fuentes, densidad del portal |

---

## Supercerebro — Proveedores IA

El Supercerebro conecta múltiples motores de IA con contexto operativo en tiempo real.

| Proveedor | Estado | Configuración |
|---|---|---|
| Claude Sonnet | ✅ Listo | `ANTHROPIC_API_KEY` |
| Antigravity Director | ✅ Listo | Usa `ANTHROPIC_API_KEY` |
| Ollama Local | 🦙 Auto-detecta | Instalar ollama.com |
| Perplexity | 🔑 Necesita key | `PERPLEXITY_API_KEY` |
| LiteLLM Gateway | 🔑 Necesita key | `LITELLM_API_KEY` + `LITELLM_BASE_URL` |
| OpenClaw | ⏳ Pendiente | En configuración |

**Módulos de contexto disponibles:** NOC · WFM · Inventario · Ventas · RRHH · Incidentes

---

## Super Admin

Acceso: sección **Sistema → 🔐 Super Admin** · PIN configurado en `ADMIN_PIN` (default: `xcien2030`).

Muestra: visitas totales · actividad hoy/semana · IPs únicas · top-10 secciones · gráfica diaria 14 días · log de últimas visitas.

---

## Endpoints del backend

El backend es un monolito FastAPI (`backend/servidor_academia.py`, 6000+ líneas).

**IMPORTANTE:** cualquier endpoint nuevo `/api/` debe registrarse **antes** del catch-all SPA al final del archivo.

| Prefijo | Descripción |
|---|---|
| `/api/noc/*` | Alertas Observium, ciudades, MTR |
| `/api/wfm/*` | Tickets Odoo CAST, cuadrillas |
| `/api/inventario/*` | Productos, stock, tránsito |
| `/api/ventas/*` | MRR, órdenes, sync Google Sheets |
| `/api/rrhh/*` | Directorio empleados |
| `/api/agentes/*` | Chat IA, Director General |
| `/api/cerebro/*` | Supercerebro multi-proveedor |
| `/api/admin/*` | Analytics de uso (PIN requerido) |
| `/api/academia/*` | Cursos, exámenes |
| `/api/tokens/*` | Sistema de tokens unificados |
| `/api/telegram/*` | Bot de alertas |
| `/api/auth/*` | Login, usuarios, roles |
| `/api/health` | Health check |

---

## Puertos

| Servicio | Puerto |
|---|---|
| Frontend (Vite dev) | **8080** |
| Backend (FastAPI) | **8002** |

El frontend usa URLs relativas. Vite proxea `/api`, `/academia`, `/static` → 8002. Funciona desde cualquier dispositivo en la red local.

---

## Deuda técnica conocida

- Leaderboard de Academia hardcodeado (no llama a ningún endpoint)
- War Room: conversación estática (no ejecuta agentes reales)
- Sin autenticación en el frontend (backend tiene JWT pero el frontend no lo usa aún)
- `servidor_academia.py` debería dividirse en routers FastAPI separados
- Secciones FODA y Adopción muestran datos de demo sin advertencia visual

---

## Soporte

Repositorio: [github.com/jmmcmx/portal-command-center](https://github.com/jmmcmx/portal-command-center)

Contacto técnico: José Miguel Macías Contreras — XCIEN Networks / Mesquite
