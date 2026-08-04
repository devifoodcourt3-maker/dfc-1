const path = require('path');

// Shared identity so install.js and uninstall.js always target the same
// Windows Service — node-windows matches services by these fields.
module.exports = {
  name: 'DFC KOT Print Agent',
  description: 'Listens for confirmed DFC Restaurant orders and auto-prints the kitchen order ticket.',
  script: path.join(__dirname, '..', 'src', 'index.js'),
};
