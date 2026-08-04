// Removes the Windows Service so it stops starting on boot.
// Run from an Administrator terminal: npm run service:uninstall
const { Service } = require('node-windows');
const serviceConfig = require('./serviceConfig');

const svc = new Service(serviceConfig);

svc.on('uninstall', () => {
  console.log(`"${serviceConfig.name}" service removed. It will no longer start automatically.`);
});

svc.on('error', (err) => {
  console.error('Service uninstall error:', err);
});

console.log(`Removing "${serviceConfig.name}" Windows Service...`);
svc.uninstall();
