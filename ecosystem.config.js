module.exports = {
  apps: [
    {
      name: 'mst-certificate',
      script: 'dist/src/main.js',
      wait_ready: true,
      kill_timeout: 300000,
    },
  ],
};
