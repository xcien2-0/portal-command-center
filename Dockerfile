# ── Etapa 1: Build del frontend ────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app
COPY package*.json bun.lock* ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# ── Etapa 2: Backend Python ────────────────────────────────────────────────────
FROM python:3.11-slim AS backend

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

WORKDIR /app/backend

# Dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Dependencias Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Código del backend
COPY backend/ .

# agente_odoo está en el root del repo
COPY agente_odoo.py .

# Frontend compilado → sirve el backend como archivos estáticos
COPY --from=frontend-builder /app/dist ./dist_frontend

# Carpeta de base de datos persistente y static
RUN mkdir -p db logs static agents/db

# Entrypoint
EXPOSE 8000
CMD ["bash", "-c", "if [ -n \"$DATA_DIR\" ]; then mkdir -p $DATA_DIR/db $DATA_DIR/agents_db $DATA_DIR/static; fi && python3 agente_odoo.py & python3 agents/telegram_agent_bot.py & exec uvicorn servidor_academia:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --log-level info"]
