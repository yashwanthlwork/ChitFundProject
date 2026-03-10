// Common gateway middleware for protected routes
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

module.exports = async function gateway(req, res, next) {
  try {
    // 1. Try JWT session cookie authentication first
    const token = req.cookies && req.cookies.session;
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = await User.findOne({ where: { id: payload.id } });
        if (!user) return res.status(401).json({ success: false, error: 'User not found' });
        if (user.banned === true) {
          return res.status(403).json({ success: false, error: 'User is banned' });
        }
        if (user.deleted === true) {
          return res.status(403).json({ success: false, error: 'User is deleted' });
        }
        if (user.active === false) {
          return res.status(403).json({ success: false, error: 'User is not active' });
        }
        req.user = user;
        return next();
      } catch (err) {
        // Invalid JWT, fall through to x-username fallback
      }
    }

    // 2. Fallback: Check for username header (legacy/test support)
    const username = req.header('x-username');
    if (!username) return res.status(401).json({ success: false, error: 'Authentication required' });
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });
    if (user.banned === true) {
      return res.status(403).json({ success: false, error: 'User is banned' });
    }
    if (user.deleted === true) {
      return res.status(403).json({ success: false, error: 'User is deleted' });
    }
    if (user.active === false) {
      return res.status(403).json({ success: false, error: 'User is not active' });
    }
    req.user = user;
    return next();
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error', details: err.message });
  }
};
