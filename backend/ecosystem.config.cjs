module.exports = {
  apps: [{
    name: 'xcien-backend',
    script: 'servidor_academia.py',
    interpreter: 'python3',
    cwd: '/Users/mesquite/Antigravity/backend',
    env_file: '/Users/mesquite/Antigravity/backend/.env',
    env: {
      PORT: 8000,
      NODE_ENV: 'production',
    },
    watch: false,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 2000,
    error_file: '/Users/mesquite/Antigravity/logs/err.log',
    out_file:   '/Users/mesquite/Antigravity/logs/out.log',
  }]
};
