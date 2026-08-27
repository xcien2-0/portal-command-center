#!/bin/bash
set -e

cd backend

if [ -n "$DATA_DIR" ]; then
  mkdir -p "$DATA_DIR/db"
  mkdir -p "$DATA_DIR/agents_db"
  mkdir -p "$DATA_DIR/static"
fi

mkdir -p db static agents/db

# Agente Odoo (polling background)
python3 ../agente_odoo.py &

# Telegram bot (polling background)
python3 agents/telegram_agent_bot.py &

exec uvicorn servidor_academia:app \
  --host 0.0.0.0 \
  --port "${PORT:-8002}" \
  --workers 1 \
  --log-level info
