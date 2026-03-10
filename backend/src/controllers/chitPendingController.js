// Chit fund pending join requests controller
const ChitFund = require('../models/ChitFund');
const Membership = require('../models/Membership');
const User = require('../models/User');


const logToFile = require('../utils/logToFile');

module.exports = {
  async getPendingJoinRequests(req, res) {
    // Defensive: always return error envelope for unauthenticated
    if (!req.user || !req.user.id) {
      logToFile('[ERROR][pending][getPendingJoinRequests][unauthenticated]', { user: req.user });
      res.status(401).json({ success: false, error: 'Unauthorized: missing user context' });
      return; // Explicit early return to prevent further execution
    }
    try {
      // Find all chit funds where user is admin
      const adminMemberships = await Membership.findAll({
        where: { UserId: req.user.id, role: 'admin', status: 'active' },
        include: [ChitFund]
      });
      const adminChitIds = adminMemberships.map(m => m.ChitFundId);
      // Find all pending join requests for those chit funds
      const pendingRequests = await Membership.findAll({
        where: { ChitFundId: adminChitIds, status: 'pending', requestedBy: 'user' },
        include: [User, ChitFund]
      });
      // For each request, get all admins and their usernames
      const result = await Promise.all(pendingRequests.map(async r => {
        const admins = await Membership.findAll({
          where: { ChitFundId: r.ChitFundId, role: 'admin', status: 'active' },
          include: [User]
        });
        return {
          membershipId: r.id,
          chitFund: r.ChitFund,
          user: r.User,
          requestedAt: r.createdAt,
          approvals: r.approvals || [],
          admins: admins.map(a => ({ userId: a.UserId, username: a.User ? a.User.username : undefined }))
        };
      }));
      logToFile('[INFO][pending][getPendingJoinRequests][success]', { user: req.user?.username, count: result.length });
      res.json({ success: true, data: result });
    } catch (err) {
      logToFile('[ERROR][pending][getPendingJoinRequests][exception]', { error: err.message, stack: err.stack, user: req.user?.username });
      res.status(500).json({ success: false, error: 'Failed to fetch pending join requests', details: err.message });
    }
  }
};
