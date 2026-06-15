const path = require('path');
const ROOT = __dirname;

module.exports = {
  apps: [
    // ── Backend FastAPI ────────────────────────────────────────────────────
    {
      name: 'xcien-backend',
      script: 'backend/servidor_academia.py',
      interpreter: '.venv/bin/python3',
      cwd: ROOT,
      instances: 1,
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,
      watch: false,
      max_memory_restart: '1G',
      env: {
        PYTHONUNBUFFERED: '1',
        PORT: 8002,
        TOKEN_SECRET: '99cce401f9cb7f94dc283ebd8ded2f3795400eb1f3dcac90e94fc979f3b4afb4',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/err.log',
      out_file:   'logs/out.log',
      merge_logs: true,
    },

    // ── Frontend Vite ──────────────────────────────────────────────────────
    {
      name: 'xcien-frontend',
      script: 'node_modules/.bin/vite',
      args: '--host',
      cwd: ROOT,
      instances: 1,
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,
      watch: false,
      env: {
        NODE_ENV: 'development',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/frontend-err.log',
      out_file:   'logs/frontend-out.log',
      merge_logs: true,
    },

    // ── Telegram Bot ───────────────────────────────────────────────────────
    {
      name: 'xcien-telegram-bot',
      script: 'backend/agents/telegram_agent_bot.py',
      interpreter: '.venv/bin/python3',
      cwd: ROOT,
      instances: 1,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
      watch: false,
      env: {
        PYTHONUNBUFFERED: '1',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/telegram-err.log',
      out_file:   'logs/telegram-out.log',
      merge_logs: true,
    },
  ],
};
