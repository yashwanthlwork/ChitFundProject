// Health check route for backend
const express = require('express');
const router = express.Router();
const sequelize = require('../db/sequelize');
const logToFile = require('../utils/logToFile');

// GET /api/health
router.get('/', async (req, res) => {
  try {
    // Check DB connection
    await sequelize.authenticate();
    res.json({ ok: true, db: 'up', status: 'ok' });
  } catch (err) {
    logToFile('[ERROR][health][exception]', { error: err.message, stack: err.stack });
    res.status(500).json({ ok: false, db: 'down', status: 'error', error: err.message });
  }
});

module.exports = router;