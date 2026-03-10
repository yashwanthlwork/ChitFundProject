// Chit fund invite-related controller logic
const ChitFund = require('../models/ChitFund');
const Membership = require('../models/Membership');
const User = require('../models/User');


const logToFile = require('../utils/logToFile');

module.exports = {
  async inviteUser(req, res) {
    try {
      const { chitId } = req.params;
      const { username } = req.body;
      if (!username) {
        logToFile('[ERROR][invite][missing-username]', { chitId, user: req.user?.username });
        return res.status(400).json({ error: 'Missing username' });
      }
      const chit = await ChitFund.findByPk(chitId);
      if (!chit) {
        logToFile('[ERROR][invite][chit-not-found]', { chitId, user: req.user?.username });
        return res.status(404).json({ error: 'Chit fund not found' });
      }
      // Block invite if startDate is today or in the past
      const today = new Date().toISOString().slice(0, 10);
      if (chit.startDate && chit.startDate <= today) {
        logToFile('[ERROR][invite][chit-started]', { chitId, user: req.user?.username });
        return res.status(400).json({ error: 'Inviting is closed. Chit fund has already started.' });
      }
      // Only admin can invite
      const admin = await Membership.findOne({ where: { UserId: req.user.id, ChitFundId: chitId, role: 'admin', status: 'active' } });
      if (!admin) {
        logToFile('[ERROR][invite][not-admin]', { chitId, user: req.user?.username });
        return res.status(403).json({ error: 'Only admin can invite' });
      }
      const user = await User.findOne({ where: { username } });
      if (!user) {
        logToFile('[ERROR][invite][user-not-found]', { chitId, username });
        return res.status(404).json({ error: 'User not found' });
      }
      // Prevent duplicate invites
      const existing = await Membership.findOne({ where: { UserId: user.id, ChitFundId: chitId } });
      if (existing) {
        logToFile('[ERROR][invite][duplicate]', { chitId, username });
        return res.status(400).json({ error: 'User already invited or member' });
      }
      await Membership.create({ UserId: user.id, ChitFundId: chitId, role: 'member', status: 'pending', requestedBy: 'admin' });
      logToFile('[INFO][invite][success]', { chitId, username, invitedBy: req.user?.username });
      return res.json({ success: true });
    } catch (err) {
      logToFile('[ERROR][invite][exception]', { error: err.message, stack: err.stack, user: req.user?.username, chitId: req.params?.chitId });
      return res.status(500).json({ error: 'Failed to invite user', details: err.message });
    }
  }
};
