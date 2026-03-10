// Centralized error handler middleware
const logToFile = require('../utils/logToFile');

module.exports = function errorHandler(err, req, res) {
  // Enhanced error tracing: log stack, request info, and error context
  let logMsg = '--- ERROR TRACE START ---\n';
  logMsg += `Timestamp: ${new Date().toISOString()}\n`;
  logMsg += `Request: ${req.method} ${req.originalUrl}\n`;
  if (req.body && Object.keys(req.body).length > 0) {
    logMsg += `Request Body: ${JSON.stringify(req.body)}\n`;
  }
  if (req.query && Object.keys(req.query).length > 0) {
    logMsg += `Request Query: ${JSON.stringify(req.query)}\n`;
  }
  if (req.headers && Object.keys(req.headers).length > 0) {
    logMsg += `Request Headers: ${JSON.stringify(req.headers)}\n`;
  }
  if (req.user) {
    logMsg += `User: ${JSON.stringify(req.user)}\n`;
  }
  if (err.stack) {
    logMsg += `Stack Trace: ${err.stack}\n`;
  } else {
    logMsg += `Error: ${err}\n`;
  }
  logMsg += '--- ERROR TRACE END ---\n';
  logToFile(logMsg);

  // Determine status code based on error type
  let status = err.status;
  // Special handling for CSRF errors
  const isCsrf = err.code === 'EBADCSRFTOKEN' || (err.message && err.message.toLowerCase().includes('csrf'));
  if (isCsrf) {
    status = 403;
    err.message = 'Invalid CSRF token. Please refresh the page or re-login.';
    err.details = 'CSRF token missing, expired, or does not match session.';
  }
  if (!status) {
    // Sequelize validation/database errors
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeDatabaseError') {
      status = 400;
    } else if (err.name === 'UnauthorizedError' || err.message?.toLowerCase().includes('unauthorized')) {
      status = 401;
    } else if (err.message?.toLowerCase().includes('forbidden')) {
      status = 403;
    } else if (err.message?.toLowerCase().includes('not found')) {
      status = 404;
    } else if (err.message?.toLowerCase().includes('bad request')) {
      status = 400;
    } else {
      status = 500;
    }
  }

  // Send error response robustly
  if (res && typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(status).json({
      success: false,
      error: err.message || 'Internal Server Error',
      details: err.details || undefined
    });
  } else if (res && typeof res.writeHead === 'function' && typeof res.end === 'function') {
    // Node.js IncomingMessage fallback (supertest edge case)
    res.writeHead(status || 500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: err.message || 'Internal Server Error',
      details: err.details || undefined
    }));
  } else if (res && typeof res.send === 'function') {
    res.send(JSON.stringify({
      success: false,
      error: err.message || 'Internal Server Error',
      details: err.details || undefined
    }));
  } else {
    // Fallback for non-Express or test environments
    console.error('Error handler called with invalid res object:', err);
  }
};
