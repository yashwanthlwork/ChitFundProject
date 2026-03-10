
const express = require('express');
const gateway = require('../middleware/gateway');
const { createChitRules, validateChit } = require('../middleware/chitValidation');
const validate = require('../middleware/validate');
const ChitFund = require('../models/ChitFund');
const Log = require('../models/Log');
const Membership = require('../models/Membership');
const ChitSession = require('../models/ChitSession');
const User = require('../models/User');
const guid = require('../utils/guid');
const logToFile = require('../utils/logToFile');

const router = express.Router();

// List all chit funds (for admin dashboard)
router.get('/list', gateway, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authenticated.' });
    }
    // Only admin can list all chit funds
    const adminMembership = await Membership.findOne({ where: { UserId: req.user.id, role: 'admin', status: 'active' } });
    if (!adminMembership) {
      return res.status(403).json({ success: false, error: 'Only admin can list all chit funds.' });
    }
    const chits = await ChitFund.findAll({
      order: [['createdAt', 'DESC']]
    });
    const result = chits.map(chit => ({
      id: chit.id,
      name: chit.name,
      monthlyAmount: chit.monthlyAmount,
      chitsLeft: chit.chitsLeft,
      description: chit.description,
      startDate: chit.startDate,
      createdAt: chit.createdAt,
      updatedAt: chit.updatedAt
    }));
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    logToFile('[ERROR][chit-list]', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch chit funds', details: err.message });
  }
});

// Place a bid in a live chit session (lowest bid wins)
router.post('/session/:sessionId/bid', gateway, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { amount } = req.body;
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({ success: false, error: 'Not authenticated.' });
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid bid amount.' });
    }
    const session = await ChitSession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }
    if (session.isCompleted) {
      return res.status(400).json({ success: false, error: 'Session is already completed.' });
    }
    // Track bid history in memory (for now, can be persisted in DB if needed)
    if (!session.bids) session.bids = [];
    // Add the new bid
    session.bids.push({ user: user.username, amount, time: new Date().toISOString() });
    // Determine the highest bid (winner: largest discount)
    let highestBid = session.bids[0];
    for (const b of session.bids) {
      if (b.amount > highestBid.amount) highestBid = b;
    }
    // Update session state
    session.currentBid = amount;
    session.lastBidder = user.username;
    session.lastBidTime = new Date().toISOString();
    session.bidAmount = highestBid.amount;
    session.finalQuote = session.chitFundValue - highestBid.amount; // Winner gets pool minus largest discount
    session.winnerId = user.id;
    // Persist changes
    await session.save();
    // Emit live update via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`auction_${sessionId}`).emit('auctionUpdate', {
        id: session.id,
        chitFundId: session.chitFundId,
        sessionNumber: session.sessionNumber,
        date: session.date,
        bidAmount: session.bidAmount,
        finalQuote: session.finalQuote,
        winnerId: session.winnerId,
        winnerGets: session.winnerGets,
        interestPool: session.interestPool,
        beneficiaries: session.beneficiaries,
        interestPerPerson: session.interestPerPerson,
        isCompleted: session.isCompleted,
        lastBidTime: session.lastBidTime,
        lastBidder: session.lastBidder,
        currentBid: session.currentBid,
        participants: session.participants,
        bids: session.bids
      });
    }
    res.json({ success: true, bid: { user: user.username, amount }, winner: highestBid });
  } catch (err) {
    logToFile('[ERROR][bid-endpoint]', err.message);
    res.status(500).json({ success: false, error: 'Failed to place bid', details: err.message });
  }
});
/**
 * Chit Fund Routes
 * @module routes/chit
 */

/**
 * Get live session info by sessionId
 * @route GET /api/chits/session/:sessionId/live
 * @group Chit - Live session
 * @param {string} sessionId.path.required - Session ID
 * @returns {object} 200 - Live session info
 * @returns {Error}  400 - Missing sessionId
 * @returns {Error}  404 - Session not found
 * @returns {Error}  500 - Failed to fetch live session
 */
/**
 * Create new session(s) for a chit fund (admin only)
 * @route POST /api/chits/:chitId/sessions
 * @group Chit - Session management
 * @param {string} chitId.path.required - Chit Fund ID
 * @param {integer} sessionNumber.body.required
 * @param {string} date.body.required
 * @param {number} bidAmount.body.optional
 * @param {number} finalQuote.body.optional
 * @param {string} winnerName.body.optional
 * @param {number} winnerGets.body.optional
 * @param {number} interestPool.body.optional
 * @param {array} beneficiaries.body.optional
 * @param {array} interestPerPerson.body.required
 * @returns {object} 201 - Session created
 * @returns {Error}  400 - Validation error
 * @returns {Error}  401 - Not authenticated
 * @returns {Error}  403 - Only admin can add sessions
 * @returns {Error}  500 - Failed to create session
 */
/**
 * Get chit fund details, session history, and statistics
 * @route GET /api/chits/:chitId/details
 * @group Chit - Details
 * @param {string} chitId.path.required - Chit Fund ID
 * @returns {object} 200 - Chit fund details
 * @returns {Error}  401 - Not authenticated
 * @returns {Error}  404 - Chit fund not found
 * @returns {Error}  500 - Failed to fetch chit fund details
 */
/**
 * Get all chit fund memberships for the current user
 * @route GET /api/chits/all-memberships
 * @group Chit - Memberships
 * @returns {object} 200 - List of memberships
 * @returns {Error}  500 - Failed to fetch chit funds
 */
/**
 * Request to join a chit fund by ID
 * @route POST /api/chits/:chitId/join
 * @group Chit - Memberships
 * @param {string} chitId.path.required - Chit Fund ID
 * @returns {object} 200 - Join request successful
 * @returns {Error}  400 - Already requested or member
 * @returns {Error}  404 - Chit fund not found
 * @returns {Error}  500 - Failed to join chit fund
 */
/**
 * Create a new chit fund (admin only)
 * @route POST /api/chits/create
 * @group Chit - Admin
 * @param {string} name.body.required
 * @param {number} monthlyAmount.body.required
 * @param {integer} chitsLeft.body.required
 * @returns {object} 201 - Chit fund created
 * @returns {Error}  400 - Could not create chit fund
 */


// Get live session info by sessionId
router.get('/session/:sessionId/live', gateway, async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Missing sessionId' });
    }
    const session = await ChitSession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }
    // Optionally, include related chit fund and members if needed
    // For now, return session fields relevant for live auction
    res.json({
      success: true,
      id: session.id,
      chitFundId: session.chitFundId,
      sessionNumber: session.sessionNumber,
      date: session.date,
      bidAmount: session.bidAmount,
      finalQuote: session.finalQuote,
      winnerId: session.winnerId,
      winnerGets: session.winnerGets,
      interestPool: session.interestPool,
      beneficiaries: session.beneficiaries,
      interestPerPerson: session.interestPerPerson,
      isCompleted: session.isCompleted,
      lastBidTime: session.lastBidTime,
      lastBidder: session.lastBidder,
      currentBid: session.currentBid,
      participants: session.participants
    });
  } catch (err) {
    logToFile('[ERROR][live-session]', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch live session', details: err.message });
  }
});

// Create new session(s) for a chit fund (admin only)
// Validation rules for session creation
const sessionRules = [
  require('express-validator').body('sessionNumber').isInt({ min: 1 }).withMessage('Session number must be a positive integer.'),
  require('express-validator').body('date').isISO8601().withMessage('Date must be a valid ISO8601 date.'),
  require('express-validator').body('bidAmount').optional().isNumeric().withMessage('Bid amount must be a number.'),
  require('express-validator').body('finalQuote').optional().isNumeric().withMessage('Final quote must be a number.'),
  require('express-validator').body('winnerName').optional().isString(),
  require('express-validator').body('winnerGets').optional().isNumeric(),
  require('express-validator').body('interestPool').optional().isNumeric(),
  require('express-validator').body('beneficiaries').optional().isArray(),
  require('express-validator').body('interestPerPerson').isArray().withMessage('interestPerPerson must be an array.')
];

router.post('/:chitId/sessions', gateway, validate(sessionRules), async (req, res) => {
  try {
    const { chitId } = req.params;
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({ success: false, error: 'Not authenticated.' });
    }
    // Only admin can create sessions
    const adminMembership = await Membership.findOne({ where: { ChitFundId: chitId, UserId: user.id, role: 'admin', status: 'active' } });
    if (!adminMembership) {
      return res.status(403).json({ success: false, error: 'Only admin can add sessions.' });
    }
    const {
      sessionNumber,
      date,
      bidAmount,
      finalQuote,
      winnerName,
      winnerGets,
      interestPool,
      beneficiaries,
      interestPerPerson
    } = req.body;
    // Find winnerId if winnerName provided
    let winnerId = null;
    if (winnerName) {
      const winner = await Membership.findOne({
        where: { ChitFundId: chitId },
        include: [{ model: User, where: { username: winnerName } }]
      });
      if (winner && winner.User) winnerId = winner.User.id;
    }
    // Map beneficiaries to user IDs
    let beneficiaryIds = [];
    if (Array.isArray(beneficiaries)) {
      for (const name of beneficiaries) {
        const m = await Membership.findOne({
          where: { ChitFundId: chitId },
          include: [{ model: User, where: { username: name } }]
        });
        if (m && m.User) beneficiaryIds.push(m.User.id);
      }
    }
    // Convert interestPerPerson to integers
    const interestPerPersonInts = interestPerPerson.map(v => Number(v));
    if (interestPerPersonInts.some(v => isNaN(v))) {
      return res.status(400).json({ success: false, error: 'interestPerPerson must contain only numbers.' });
    }
    await ChitSession.create({
      chitFundId: chitId,
      sessionNumber,
      date,
      bidAmount,
      finalQuote,
      winnerId,
      winnerGets,
      interestPool,
      beneficiaries: beneficiaryIds,
      interestPerPerson: interestPerPersonInts,
      isCompleted: false
    });
    return res.status(201).json({ success: true });
  } catch (err) {
    logToFile('[ERROR][create-session]', JSON.stringify({
      error: err.message,
      stack: err.stack,
      body: req.body
    }));
    return res.status(500).json({ success: false, error: 'Failed to create session', details: err.message });
  }
});
// Get chit fund details, session history, and statistics
router.get('/:chitId/details', gateway, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authenticated: missing username header or session.' });
    }
    const { chitId } = req.params;
    // 1. Get chit fund
    const chitFund = await ChitFund.findByPk(chitId);
    if (!chitFund) return res.status(404).json({ success: false, error: 'Chit fund not found' });

    // 2. Get all sessions for this chit fund
    const sessions = await ChitSession.findAll({
      where: { chitFundId: chitId },
      order: [['sessionNumber', 'ASC']]
    });

    // 3. Get all members (with roles)
    const memberships = await Membership.findAll({
      where: { ChitFundId: chitId },
      include: [{ model: User, attributes: ['id', 'username', 'firstName', 'lastName'] }]
    });
    const members = memberships.map(m => ({
      id: m.User?.id,
      username: m.User?.username,
      name: m.User?.firstName ? `${m.User.firstName} ${m.User.lastName || ''}`.trim() : m.User?.username,
      role: m.role
    }));

    // 4. Compute statistics
    let totalInterest = 0, sumBid = 0, highestQuote = 0, lowestQuote = null, winCounts = {};
    sessions.forEach(s => {
      totalInterest += s.interestPool || 0;
      sumBid += s.bidAmount || 0;
      if (s.finalQuote > highestQuote) highestQuote = s.finalQuote;
      if (lowestQuote === null || s.finalQuote < lowestQuote) lowestQuote = s.finalQuote;
      if (s.winnerId) winCounts[s.winnerId] = (winCounts[s.winnerId] || 0) + 1;
    });
    const avgBid = sessions.length ? Math.round(sumBid / sessions.length) : 0;
    let mostWinsUser = null, mostWinsCount = 0;
    for (const [uid, count] of Object.entries(winCounts)) {
      if (count > mostWinsCount) {
        mostWinsUser = members.find(m => m.id === uid)?.name || uid;
        mostWinsCount = count;
      }
    }

    // 5. Format session data for frontend
    const sessionsOut = sessions.map(s => ({
      sessionNumber: s.sessionNumber,
      date: s.date,
      bidAmount: s.bidAmount,
      finalQuote: s.finalQuote,
      winnerName: members.find(m => m.id === s.winnerId)?.name || '-',
      winnerGets: s.winnerGets,
      interestPool: s.interestPool,
      beneficiaries: (s.beneficiaries || []).map(uid => members.find(m => m.id === uid)?.name || uid),
      interestPerPerson: s.interestPerPerson,
      isCompleted: !!s.isCompleted
    }));

    // 6. Admin name
    const admin = members.find(m => m.role === 'admin');

    res.json({
      success: true,
      chitFund: {
        id: chitFund.id,
        name: chitFund.name,
        monthlyAmount: chitFund.monthlyAmount,
        chitsLeft: chitFund.chitsLeft,
        description: chitFund.description,
        startDate: chitFund.startDate,
        status: null, // can be computed on frontend
        adminUsername: admin?.username || null,
        adminName: admin?.name || null
      },
      sessions: sessionsOut,
      stats: {
        totalInterest,
        avgBid,
        highestQuote,
        lowestQuote,
        mostWinsUser,
        mostWinsCount
      },
      members
    });
  } catch (err) {
    logToFile('[ERROR][chit-details]', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch chit fund details', details: err.message });
  }
});

router.get('/all-memberships', gateway, async (req, res) => {
  try {
    const memberships = await Membership.findAll({
      where: { UserId: req.user.id },
      include: [{
        model: ChitFund,
        attributes: [
          'id', 'name', 'monthlyAmount', 'chitsLeft', 'description', 'startDate',
          'createdAt', 'updatedAt'
        ]
      }],
      order: [['createdAt', 'DESC']]
    });
    // Validate and sanitize output for finance compliance
    const result = memberships.map(m => {
      const chit = m.ChitFund;
      // Defensive: ensure all required fields are present
      if (!chit || !chit.id || !chit.name) {
        return null;
      }
      return {
        chitFund: {
          id: chit.id,
          name: chit.name,
          monthlyAmount: chit.monthlyAmount,
          chitsLeft: chit.chitsLeft,
          description: chit.description,
          startDate: chit.startDate,
          createdAt: chit.createdAt,
          updatedAt: chit.updatedAt
        },
        role: m.role,
        status: m.status,
        createdAt: m.createdAt
      };
    }).filter(Boolean);
    res.json({ success: true, data: result });
  } catch (err) {
    // Log error for audit trail
    logToFile('[ERROR][all-memberships]', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch chit funds', details: err.message });
  }
});

// Request to join by chit fund ID (user)

// Robust error handling and logging for join requests

router.post('/:chitId/join', gateway, async (req, res) => {
  try {
    const { chitId } = req.params;
    const chit = await ChitFund.findByPk(chitId);
    if (!chit) {
      logToFile('[ERROR][join][not-found]', { chitId, user: req.user?.username });
      return res.status(404).json({ success: false, error: 'Chit fund not found' });
    }
    // Check for existing membership
    const existing = await Membership.findOne({ where: { UserId: req.user.id, ChitFundId: chitId } });
    if (existing) {
      if (existing.status === 'active') {
        // Already a member, idempotent success
        logToFile('[INFO][join][already-active]', { chitId, user: req.user?.username });
        return res.status(200).json({ success: true, message: 'Already a member' });
      } else {
        // Already requested or pending
        logToFile('[ERROR][join][duplicate]', { chitId, user: req.user?.username });
        return res.status(400).json({ success: false, error: 'Already requested or member' });
      }
    }
    // Create new pending membership
    try {
      await Membership.create({ UserId: req.user.id, ChitFundId: chitId, role: 'member', status: 'pending', requestedBy: 'user' });
      logToFile('[INFO][join][success]', { chitId, user: req.user?.username });
      return res.status(201).json({ success: true });
    } catch (err) {
      logToFile('[ERROR][join][membership-create-failed]', { chitId, user: req.user?.username, error: err.message });
      return res.status(500).json({ success: false, error: 'Failed to create membership', details: err.message });
    }
  } catch (err) {
    logToFile('[ERROR][join][exception]', { error: err.message, stack: err.stack, user: req.user?.username, chitId: req.params?.chitId });
    return res.status(500).json({ success: false, error: 'Failed to join chit fund', details: err.message });
  }
});


// List pending requests for admin
router.post('/create', gateway, validateChit(createChitRules), async (req, res) => {
  let responded = false;
  const { name, monthlyAmount, chitsLeft } = req.body;
  const actionGuid = guid();
  try {
    const chit = await ChitFund.create({ name, monthlyAmount, chitsLeft });
    await Membership.create({ UserId: req.user.id, ChitFundId: chit.id, role: 'admin', status: 'active', requestedBy: 'admin' });
    const logSuccess = {
      guid: actionGuid,
      action: 'create_chitfund_success',
      details: `ChitFund created: ${chit.id}`,
      userId: req.user?.username || null,
      chitFundId: chit.id
    };
    logToFile('Log.create (success):', logSuccess);
    await Log.create(logSuccess);
    res.status(201).json({
      success: true,
      chitFund: chit.toJSON(),
      guid: actionGuid
    });
    responded = true;
    return;
  } catch (err) {
    // Only pass chitFundId if it is a valid UUID
    let chitFundId = undefined;
    if (err.chit && err.chit.id && typeof err.chit.id === 'string' && err.chit.id.length === 36) {
      chitFundId = err.chit.id;
    }
    const logFail = {
      guid: actionGuid,
      action: 'create_chitfund_failed',
      details: err.message,
      userId: req.user?.username || null,
      ...(chitFundId ? { chitFundId } : {})
    };
    logToFile('Log.create (fail):', logFail);
    await Log.create(logFail);
    res.status(400).json({
      success: false,
      error: 'Could not create chit fund',
      details: err.message,
      guid: actionGuid
    });
    responded = true;
    return;
  }
  if (!responded) {
    res.status(500).json({ success: false, error: 'Unknown error occurred in create handler' });
  }
});

module.exports = router;
