// cPanel / Passenger startup file. This CommonJS entry works with ESM builds.
const path = require('node:path');
process.chdir(__dirname);
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });
process.env.NODE_ENV = 'production';

import('./scripts/serve-hosting.mjs').then(({ startHosting }) => startHosting()).catch(error => {
  console.error('Application startup failed:', error.message);
  process.exitCode = 1;
});
