// Session/cookie-based authentication middleware
// Sets req.user if authenticated, else returns 401 error envelope

const logToFile = require('../utils/logToFile');
module.exports = function authenticate(req, res, next) {
  // Check for user in session (req.user set by passport/JWT/cookie middleware)
  if (req.user && req.user.id) {
    return next();
  }
  // Defensive: check for user in req.session (if using express-session)
  if (req.session && req.session.user && req.session.user.id) {
    req.user = req.session.user;
    return next();
  }
  // Not authenticated
  logToFile('[ERROR][middleware][authenticate][unauthenticated]', { path: req.originalUrl, method: req.method, ip: req.ip, user: req.user });
  res.status(401).json({ success: false, error: 'Authentication required' });
  return; // Explicitly stop further middleware/controller execution
};
