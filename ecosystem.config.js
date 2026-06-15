module.exports = {
  apps: [{
    name: 'marketplace',
    script: 'server.cjs',
    autorestart: true,
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }]
};
