// Installs the print agent as a Windows Service: starts automatically on
// boot (no one needs to be logged in), and restarts itself if it crashes.
// Run from an Administrator terminal: npm run service:install
const { Service } = require('node-windows');
const serviceConfig = require('./serviceConfig');

const svc = new Service({
  ...serviceConfig,
  // Auto-restart on crash, backing off so a persistent failure (e.g. printer
  // left permanently offline) doesn't spin-restart forever.
  maxRestarts: 10,
  wait: 2,
  grow: 0.5,
});

svc.on('install', () => {
  console.log('Service installed — starting it now...');
  svc.start();
});

svc.on('alreadyinstalled', () => {
  console.log('Already installed. Run "npm run service:uninstall" first if you want to reinstall it.');
});

svc.on('start', () => {
  console.log(`"${serviceConfig.name}" is running and will now start automatically on every reboot.`);
  console.log('View its status any time in Windows Services (services.msc).');
});

svc.on('error', (err) => {
  console.error('Service install/start error:', err);
});

console.log(`Installing "${serviceConfig.name}" as a Windows Service...`);
svc.install();
