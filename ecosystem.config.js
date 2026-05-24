module.exports = {
  apps: [{
    name: 'wnrmidia-backend',
    script: './backend/src/server.js',
    cwd: '/var/www/wnrmidia',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    watch: false,
    max_memory_restart: '512M',
    restart_delay: 5000,
  }]
}
