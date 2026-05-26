# ── Etapa 1: Build del frontend ────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app
COPY package*.json bun.lock* ./
RUN npm install --frozen-lockfile 2>/dev/null || npm install

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

# Frontend compilado → sirve el backend como archivos estáticos
COPY --from=frontend-builder /app/dist ./dist_frontend

# Carpeta de base de datos persistente
RUN mkdir -p db logs

# Entrypoint
EXPOSE 8000
CMD ["uvicorn", "servidor_academia:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
