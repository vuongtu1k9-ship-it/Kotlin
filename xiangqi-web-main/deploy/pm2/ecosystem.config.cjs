const appName = process.env.APP_NAME || 'xiangqi-web';
const deployRoot = process.env.DEPLOY_ROOT || `/var/www/${appName}`;
const envFile = process.env.ENV_FILE || `${deployRoot}/shared/.env`;

module.exports = {
  apps: [
    {
      name: appName,
      script: 'server/index.mjs',
      cwd: `${deployRoot}/current`,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3001,
        BUILD_NAME: process.env.BUILD_NAME || 'dev',
        FONTCONFIG_PATH: `${deployRoot}/shared/fonts`,
        NODE_OPTIONS: '--openssl-legacy-provider',
      },
      env_file: envFile,
      out_file: `${deployRoot}/shared/logs/pm2-out.log`,
      error_file: `${deployRoot}/shared/logs/pm2-error.log`,
      merge_logs: true,
      time: true,
    },
  ],
};
