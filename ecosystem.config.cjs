module.exports = {
  apps: [
    {
      name: 'xcien-backend',
      script: 'backend/servidor_academia.py',
      interpreter: 'python3',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 8000,
        PYTHONUNBUFFERED: "1",
        TOKEN_SECRET: "99cce401f9cb7f94dc283ebd8ded2f3795400eb1f3dcac90e94fc979f3b4afb4"
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      merge_logs: true
    }
  ]
};
