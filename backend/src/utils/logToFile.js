/* global console */
// Centralized logToFile utility for robust logging
const fs = require('fs');
const path = require('path');

const LOG_FILE_BACKEND = path.join(__dirname, '../../../logs/backend.log');
const LOG_FILE_FRONTEND = path.join(__dirname, '../../../logs/frontend.log');


function ensureLogDir() {
  fs.mkdirSync(path.dirname(LOG_FILE_BACKEND), { recursive: true });
}

function logToFile(msg, opts = {}) {
  ensureLogDir();
  const { source = 'backend', stack, meta } = opts;
  let file = source === 'frontend' ? LOG_FILE_FRONTEND : LOG_FILE_BACKEND;
  // Log both msg and opts for full context
  let logMsg = `[${new Date().toISOString()}] [${source}] `;
  if (typeof msg === 'object') {
    logMsg += JSON.stringify(msg);
  } else {
    logMsg += msg;
  }
  if (opts && Object.keys(opts).length > 0) {
    logMsg += ' | opts: ' + JSON.stringify(opts);
  }
  try {
    fs.appendFileSync(file, logMsg + '\n');
  } catch (err) {
    if (typeof console !== 'undefined' && console.error) console.error('logToFile error:', err);
  }
}

module.exports = logToFile;
