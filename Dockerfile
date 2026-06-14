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

# Frontend compilado → sirve el backend como archivos estáticos
COPY --from=frontend-builder /app/dist ./dist_frontend

# Carpeta de base de datos persistente y static (evita crash si no viene del repo)
RUN mkdir -p db logs static

# Entrypoint — workers=1 obligatorio: SSE y estado en memoria no son compatibles con multi-worker
EXPOSE 8000
CMD ["sh", "-c", "uvicorn servidor_academia:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
