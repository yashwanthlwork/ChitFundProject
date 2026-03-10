// User controller: registration, login, username check
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const guid = require('../utils/guid');
const logToFile = require('../utils/logToFile');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const SESSION_TIMEOUT_MINUTES = parseInt(process.env.SESSION_TIMEOUT_MINUTES, 10) || 30;
const JWT_EXPIRES_IN = `${SESSION_TIMEOUT_MINUTES}m`;


module.exports = {
  // Logout: clear session cookie
  logout(req, res) {
    try {
      res.clearCookie('session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      logToFile('[INFO][logout][success]', { user: req.user?.username });
      return res.json({ success: true });
    } catch (err) {
      logToFile('[ERROR][logout][exception]', { error: err.message, stack: err.stack, user: req.user?.username });
      return res.status(500).json({ success: false, error: 'Failed to logout', details: err.message });
    }
  },

  async checkUsername(req, res) {
    const { username } = req.query;
    logToFile(`[userController.checkUsername] called with: ${JSON.stringify({ username })}`);
    if (!username) return res.status(400).json({ success: false, available: false, error: 'Missing username' });
    try {
      const user = await User.findOne({ where: { username } });
      logToFile(`[SUCCESS][checkUsername] Username checked: ${username}, available: ${!user}`);
      return res.json({ success: true, available: !user });
    } catch (err) {
      logToFile(`[userController.checkUsername] error: ${err && err.stack ? err.stack : err}`);
      return res.status(500).json({ success: false, available: false, error: 'Failed to check username', details: err.message });
    }
  },
  async register(req, res) {
    const { username, password, firstName, lastName, mobile } = req.body;
    const actionGuid = guid();
    logToFile(`[userController.register] called with: ${JSON.stringify({ username, firstName, lastName, mobile })}`);
    if (!username || !password) {
      logToFile(`[DEBUG][register] Missing fields: username=${username}, password=${password}`);
      res.status(400);
      logToFile(`[DEBUG][register] Responding with status 400 for missing fields`);
      return res.json({ success: false, error: 'Missing fields', guid: actionGuid });
    }
    try {
      const hash = await bcrypt.hash(password, 10);
      const picturePath = req.file ? `/uploads/profile-pics/${req.file.filename}` : null;
      const user = await User.create({
        username,
        password: hash,
        firstName,
        lastName,
        mobile,
        picture: picturePath
      });
      logToFile(`[SUCCESS][register] User registered: ${user.username}`);
      return res.status(201).json({ success: true, id: user.id, username: user.username, picture: user.picture, guid: actionGuid });
    } catch (err) {
      logToFile(`[userController.register] error: ${err && err.stack ? err.stack : err}`);
      return res.status(500).json({ success: false, error: 'Failed to register', details: err.message, guid: actionGuid });
    }
  },
  async login(req, res) {
    const { username, password } = req.body;
    const actionGuid = guid();
    logToFile(`[userController.login] called with: ${JSON.stringify({ username })}`);
    if (!username || !password) {
      logToFile(`[DEBUG][login] Missing fields: username=${username}, password=${password}`);
      res.status(400);
      logToFile(`[DEBUG][login] Responding with status 400 for missing fields`);
      return res.json({ success: false, error: 'Missing username or password', guid: actionGuid });
    }
    try {
      const user = await User.findOne({ where: { username } });
      if (!user) {
        return res.status(401).json({ success: false, error: 'User not found', guid: actionGuid });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ success: false, error: 'Incorrect password', guid: actionGuid });
      }
      // Issue JWT as HTTP-only, Secure cookie
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      res.cookie('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      logToFile(`[SUCCESS][login] User logged in: ${user.username}`);
      return res.json({ success: true, id: user.id, username: user.username, picture: user.picture, guid: actionGuid });
    } catch (err) {
      logToFile(`[userController.login] error: ${err && err.stack ? err.stack : err}`);
      return res.status(500).json({ success: false, error: 'Failed to login', details: err.message, guid: actionGuid });
    }
  },

  // Session check endpoint
  async me(req, res, next) {
    const token = req.cookies && req.cookies.session;
    if (!token) return res.status(401).json({ success: false, error: 'Not authenticated' });
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = await User.findOne({ where: { id: payload.id } });
      if (!user) return res.status(401).json({ success: false, error: 'User not found' });
      return res.json({ success: true, id: user.id, username: user.username, picture: user.picture });
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Invalid session' });
    }
  }
};
