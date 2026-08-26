#!/bin/bash
# Script de arranque para Railway / producción
# Configura DATA_DIR si existe volumen montado
set -e

cd backend

# Crear directorios de datos persistentes
if [ -n "$DATA_DIR" ]; then
  mkdir -p "$DATA_DIR/db"
  mkdir -p "$DATA_DIR/agents_db"
  mkdir -p "$DATA_DIR/static"
fi

mkdir -p db static agents/db

exec uvicorn servidor_academia:app \
  --host 0.0.0.0 \
  --port "${PORT:-8002}" \
  --workers 1 \
  --log-level info
