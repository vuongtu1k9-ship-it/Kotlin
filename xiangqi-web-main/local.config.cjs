
module.exports = {
  apps: [
    {
      name: 'xiangqi-server-local',
      script: 'server/index.mjs',
      cwd: process.cwd(),
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        PUBLIC_BASE_URL: 'http://localhost:3001',
        NODE_OPTIONS: '--openssl-legacy-provider',
      },
      env_file: '.env',
      out_file: 'logs/pm2-out.log',
      error_file: 'logs/pm2-error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
