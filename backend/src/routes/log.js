// API route to receive frontend logs and write to backend log file
const express = require('express');
const router = express.Router();
const logToFile = require('../utils/logToFile');

// POST /api/log { level, message, meta }

router.post('/', (req, res) => {
  try {
    const { level = 'info', message, meta, stack } = req.body;
    if (!message) {
      logToFile('[ERROR][log][missing-message]', { body: req.body });
      return res.status(400).json({ success: false, error: 'Missing log message' });
    }
    logToFile(`[${level}] ${message}`, { source: 'frontend', meta, stack });
    return res.json({ success: true });
  } catch (err) {
    logToFile('[ERROR][log][exception]', { error: err.message, stack: err.stack });
    return res.status(500).json({ success: false, error: 'Failed to log message', details: err.message });
  }
});

module.exports = router;
