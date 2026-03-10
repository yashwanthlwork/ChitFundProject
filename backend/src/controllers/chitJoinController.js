// Chit fund join-related controller logic
const ChitFund = require('../models/ChitFund');
const Membership = require('../models/Membership');

module.exports = {
  async joinByName(req, res) {
    const logToFile = require('../utils/logToFile');
    try {
      const { name } = req.body;
      if (!name) {
        logToFile('[ERROR][joinByName][missing-name]', { user: req.user?.username });
        return res.status(400).json({ success: false, error: 'Missing chit fund name' });
      }
      const chit = await ChitFund.findOne({ where: { name } });
      if (!chit) {
        logToFile('[ERROR][joinByName][not-found]', { name, user: req.user?.username });
        return res.status(404).json({ success: false, error: 'Chit fund not found' });
      }
      // Block join if startDate is today or in the past
      const today = new Date().toISOString().slice(0, 10);
      if (chit.startDate && chit.startDate <= today) {
        logToFile('[ERROR][joinByName][chit-started]', { name, user: req.user?.username });
        return res.status(400).json({ success: false, error: 'Joining is closed. Chit fund has already started.' });
      }
      // Check for existing membership
      const existing = await Membership.findOne({ where: { UserId: req.user.id, ChitFundId: chit.id }, order: [['createdAt', 'DESC']] });
      if (existing && (existing.status === 'active' || existing.status === 'pending')) {
        logToFile('[ERROR][joinByName][duplicate]', { name, user: req.user?.username });
        return res.status(400).json({ success: false, error: 'Already requested or member' });
      }
      // If rejected or no previous, allow new request (fresh approvals)
      await Membership.create({ UserId: req.user.id, ChitFundId: chit.id, role: 'member', status: 'pending', requestedBy: 'user', approvals: [] });
      logToFile('[INFO][joinByName][success]', { name, user: req.user?.username });
      // (Notification to admins would go here)
      return res.json({ success: true });
    } catch (err) {
      logToFile('[ERROR][joinByName][exception]', { error: err.message, stack: err.stack, user: req.user?.username });
      return res.status(500).json({ success: false, error: 'Failed to join chit fund by name', details: err.message });
    }
  },
  // ...other join-related methods can be added here
};
