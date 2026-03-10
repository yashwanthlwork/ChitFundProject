// Chit fund CRUD controller (create, list, etc.)
const ChitFund = require('../models/ChitFund');
const Log = require('../models/Log');
const Membership = require('../models/Membership');
const guid = require('../utils/guid');
const logToFile = require('../utils/logToFile');

module.exports = {
  async createChitFund(req, res) {
    // Defensive: ensure res is a valid Express response
    if (!res || typeof res.status !== 'function' || typeof res.json !== 'function') {
      require('../utils/logToFile')('[FATAL][createChitFund] Invalid res object', { res });
      if (res && typeof res.writeHead === 'function' && typeof res.end === 'function') {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Internal server error: invalid response object' }));
      }
      return;
    }
    // Whitelist only allowed fields
    const { name, monthlyAmount, chitsLeft } = req.body;
    const chitData = { name, monthlyAmount, chitsLeft };
    const actionGuid = guid();
    // Defensive: always return error envelope for unauthenticated
    if (!req.user || !req.user.id) {
      logToFile('[ERROR][createChitFund][unauthenticated]', { user: req.user, body: req.body, guid: actionGuid });
      if (!res.headersSent) {
        return res.status(401).json({ success: false, error: 'Unauthorized: missing user context', guid: actionGuid });
      }
      return;
    }
    // Explicit input validation for required fields
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Name is required and must be at least 3 characters', guid: actionGuid });
    }
    if (!monthlyAmount || typeof monthlyAmount !== 'number' || monthlyAmount <= 0) {
      return res.status(400).json({ success: false, error: 'monthlyAmount must be a positive number', guid: actionGuid });
    }
    if (!chitsLeft || typeof chitsLeft !== 'number' || !Number.isInteger(chitsLeft) || chitsLeft <= 0) {
      return res.status(400).json({ success: false, error: 'chitsLeft must be a positive integer', guid: actionGuid });
    }
    try {
      // Check for duplicate chit fund name
      const existing = await ChitFund.findOne({ where: { name } });
      if (existing) {
        await Log.create({
          guid: actionGuid,
          action: 'create_chitfund_failed',
          details: `Duplicate chit fund name: ${name}`,
          userId: req.user?.username || null
        });
        return res.status(409).json({ success: false, error: 'Chit fund name already exists', guid: actionGuid });
      }
      let chit;
      try {
        chit = await ChitFund.create(chitData); // Only whitelisted fields
      } catch (err) {
        console.error('[ERROR][ChitFund.create]', err);
        await Log.create({
          guid: actionGuid,
          action: 'create_chitfund_failed',
          details: err.message,
          userId: req.user?.username || null
        });
        return res.status(400).json({ success: false, error: 'ChitFund creation failed', details: err.message, guid: actionGuid });
      }
      try {
        await Membership.create({ UserId: req.user.id, ChitFundId: chit.id, role: 'admin', status: 'active', requestedBy: 'admin' });
      } catch (err) {
        console.error('[ERROR][Membership.create]', err);
        await Log.create({
          guid: actionGuid,
          action: 'create_chitfund_failed',
          details: err.message,
          userId: req.user?.username || null
        });
        return res.status(400).json({ success: false, error: 'Membership creation failed', details: err.message, guid: actionGuid });
      }
      const logSuccess = {
        guid: actionGuid,
        action: 'create_chitfund_success',
        details: `ChitFund created: ${chit.id}`,
        userId: req.user?.username || null,
        chitFundId: chit.id
      };
      logToFile('Log.create (success):', logSuccess);
      await Log.create(logSuccess);
      return res.status(201).json({
        success: true,
        chitFund: chit.toJSON(),
        guid: actionGuid
      });
    } catch (err) {
      await Log.create({
        guid: actionGuid,
        action: 'create_chitfund_failed',
        details: err.message,
        userId: req.user?.username || null
      });
      return res.status(500).json({ success: false, error: 'Internal server error', guid: actionGuid });
    }
  },
  async listUserChits(req, res) {
    // Defensive: ensure res is a valid Express response
    if (!res || typeof res.status !== 'function' || typeof res.json !== 'function') {
      require('../utils/logToFile')('[FATAL][listUserChits] Invalid res object', { res });
      if (res && typeof res.writeHead === 'function' && typeof res.end === 'function') {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Internal server error: invalid response object' }));
      }
      return;
    }
    // Defensive: always return error envelope for unauthenticated
    if (!req.user || !req.user.id) {
      logToFile('[ERROR][listUserChits][unauthenticated]', { user: req.user });
      if (!res.headersSent) {
        return res.status(401).json({ success: false, error: 'Unauthorized: missing user context' });
      }
      return;
    }
    try {
      logToFile('[DEBUG][listUserChits][entry]', { user: req.user });
      const memberships = await Membership.findAll({
        where: { UserId: req.user.id },
        include: [ChitFund]
      });
      const result = memberships.map(m => ({
        chitFund: m.ChitFund,
        role: m.role
      }));
      logToFile('[DEBUG][listUserChits][success]', { count: result.length, user: req.user?.username });
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      logToFile('[ERROR][listUserChits][exception]', { error: err.message, stack: err.stack, user: req.user });
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
};
