module.exports = {
  apps: [{
    name: 'xcien-backend',
    script: 'servidor_academia.py',
    interpreter: 'python3',
    cwd: '/Users/mesquite/Antigravity/backend',
    env_file: '/Users/mesquite/Antigravity/backend/.env',
    env: {
      PORT: 8002,
      NODE_ENV: 'production',
    },
    watch: false,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 2000,
    error_file: '/Users/mesquite/Antigravity/logs/err.log',
    out_file:   '/Users/mesquite/Antigravity/logs/out.log',
  }, {
    name: 'xcien-reporte-semanal',
    script: 'reporte_semanal.py',
    interpreter: 'python3',
    cwd: '/Users/mesquite/Antigravity/backend',
    env_file: '/Users/mesquite/Antigravity/backend/.env',
    cron_restart: '0 9 * * 6',   // cada sábado a las 09:00 AM
    autorestart: false,
    watch: false,
    error_file: '/Users/mesquite/Antigravity/logs/reporte-err.log',
    out_file:   '/Users/mesquite/Antigravity/logs/reporte-out.log',
  }, {
    name: 'noc-reporte-diario',
    script: 'reporte_diario_noc.py',
    interpreter: 'python3',
    cwd: '/Users/mesquite/Antigravity/backend',
    cron_restart: '0 8 * * *',   // todos los días a las 08:00 AM
    autorestart: false,
    watch: false,
    error_file: '/Users/mesquite/Antigravity/logs/noc-reporte-err.log',
    out_file:   '/Users/mesquite/Antigravity/logs/noc-reporte-out.log',
  }, {
    name: 'iblack-bot',
    script: 'bot_iblack.py',
    interpreter: 'python3',
    cwd: '/Users/mesquite/Antigravity/backend',
    env_file: '/Users/mesquite/Antigravity/backend/.env',
    watch: false,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 3000,
    error_file: '/Users/mesquite/Antigravity/logs/iblack-bot-err.log',
    out_file:   '/Users/mesquite/Antigravity/logs/iblack-bot-out.log',
  }]
};
