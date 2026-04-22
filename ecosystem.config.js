module.exports = {
  apps: [
    {
      name: 'shiesty-raiders',
      script: 'npm',
      args: 'start',
      cwd: '.',
      env: {
        NODE_ENV: 'production',
        APP_URL: 'http://shiesty.me'
      },
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      log_file: './logs/raiders-combined.log',
      time: true,
      merge_logs: true,
      min_uptime: '10s',
      kill_timeout: 5000
    },
    {
      name: 'shiesty-bot',
      script: 'tsx',
      args: 'bot.ts',
      cwd: '.',
      env: {
        NODE_ENV: 'production',
        APP_URL: 'http://shiesty.me'
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      log_file: './logs/bot-combined.log',
      time: true
    }
  ]
};
