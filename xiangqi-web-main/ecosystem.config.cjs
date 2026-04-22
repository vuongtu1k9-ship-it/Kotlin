
module.exports = {
  apps: [
    {
      name: 'xiangqi-server',
      script: 'server/index.mjs',
      cwd: process.cwd(),
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
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
