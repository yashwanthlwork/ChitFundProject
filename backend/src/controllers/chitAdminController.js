// Chit fund admin approval/rejection controller
const Membership = require('../models/Membership');


const logToFile = require('../utils/logToFile');

module.exports = {
  async handleRequestAction(req, res) {
    try {
      const { chitId, membershipId } = req.params;
      const { action } = req.body; // 'approve' or 'reject'
      // Explicit validation for required params
      if (!chitId || !membershipId || !action) {
        logToFile('[ERROR][admin][missing-params]', { chitId, membershipId, action, user: req.user?.username });
        return res.status(400).json({ success: false, error: 'chitId, membershipId, and action are required' });
      }
      // Only admin can approve/reject
      const admin = await Membership.findOne({ where: { UserId: req.user.id, ChitFundId: chitId, role: 'admin', status: 'active' } });
      if (!admin) {
        logToFile('[ERROR][admin][not-admin]', { chitId, user: req.user?.username });
        return res.status(403).json({ success: false, error: 'Only admin can approve/reject' });
      }
      const membership = await Membership.findByPk(membershipId);
      if (!membership || membership.ChitFundId !== chitId) {
        logToFile('[ERROR][admin][request-not-found]', { chitId, membershipId });
        return res.status(404).json({ success: false, error: 'Request not found' });
      }
      if (membership.status !== 'pending') {
        logToFile('[ERROR][admin][already-handled]', { chitId, membershipId });
        return res.status(400).json({ success: false, error: 'Request already handled' });
      }

      // Multi-admin approval logic
      if (action === 'approve') {
        // Track approvals as array of admin userIds
        const approvals = Array.isArray(membership.approvals) ? membership.approvals : [];
        if (!approvals.includes(req.user.id)) {
          approvals.push(req.user.id);
        }
        membership.approvals = approvals;

        // Get all current admins for this chit fund
        const allAdmins = await Membership.findAll({
          where: { ChitFundId: chitId, role: 'admin', status: 'active' }
        });
        const allAdminIds = allAdmins.map(a => a.UserId);

        // If all admins have approved, activate membership
        const allApproved = allAdminIds.every(id => approvals.includes(id));
        if (allApproved) {
          membership.status = 'active';
        }
        await membership.save();
        logToFile('[INFO][admin][approved]', { chitId, membershipId, user: req.user?.username, allApproved });
        return res.json({ success: true, allApproved });
      } else if (action === 'reject') {
        membership.status = 'rejected';
        await membership.save();
        logToFile('[INFO][admin][rejected]', { chitId, membershipId, user: req.user?.username });
        return res.json({ success: true });
      } else {
        logToFile('[ERROR][admin][invalid-action]', { chitId, membershipId, action });
        return res.status(400).json({ success: false, error: 'Invalid action' });
      }
    } catch (err) {
      logToFile('[ERROR][admin][exception]', { error: err.message, stack: err.stack, user: req.user?.username, chitId: req.params?.chitId });
      return res.status(500).json({ success: false, error: 'Failed to handle request', details: err.message });
    }
  }
};
