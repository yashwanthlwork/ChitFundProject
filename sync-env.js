// sync-env.js
// Syncs SESSION_TIMEOUT_MINUTES from root .env to frontend/.env as VITE_SESSION_TIMEOUT_MINUTES
// Usage: node sync-env.js

const fs = require('fs');
const path = require('path');

const ROOT_ENV = path.join(__dirname, '.env');
const FRONTEND_ENV = path.join(__dirname, 'frontend/.env');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

function syncSessionTimeout() {
  const rootEnv = parseEnvFile(ROOT_ENV);
  if (!rootEnv.SESSION_TIMEOUT_MINUTES) {
    console.error('SESSION_TIMEOUT_MINUTES not found in root .env');
    process.exit(1);
  }
  let frontendEnv = '';
  if (fs.existsSync(FRONTEND_ENV)) {
    frontendEnv = fs.readFileSync(FRONTEND_ENV, 'utf8');
    // Remove any existing VITE_SESSION_TIMEOUT_MINUTES line
    frontendEnv = frontendEnv.replace(/^VITE_SESSION_TIMEOUT_MINUTES=.*$/m, '').replace(/\n{2,}/g, '\n');
    frontendEnv = frontendEnv.trim() + '\n';
  }
  frontendEnv += `VITE_SESSION_TIMEOUT_MINUTES=${rootEnv.SESSION_TIMEOUT_MINUTES}\n`;
  fs.writeFileSync(FRONTEND_ENV, frontendEnv);
  console.log(`Synced SESSION_TIMEOUT_MINUTES=${rootEnv.SESSION_TIMEOUT_MINUTES} to frontend/.env as VITE_SESSION_TIMEOUT_MINUTES`);
}

if (require.main === module) {
  syncSessionTimeout();
}
