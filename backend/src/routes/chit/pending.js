const express = require('express');
const router = express.Router();
const chitPendingController = require('../../controllers/chitPendingController');
const authenticate = require('../../middleware/authenticate');

// GET /api/chits/pending-join-requests
router.get('/pending-join-requests', authenticate, chitPendingController.getPendingJoinRequests);

// Catch-all error handler for unmatched routes or errors
router.use((err, req, res, next) => {
	const logToFile = require('../../utils/logToFile');
	logToFile('[ERROR][pending-router][unhandled]', { error: err?.message, stack: err?.stack, path: req.originalUrl });
	if (!res.headersSent) {
		res.status(500).json({ success: false, error: 'Internal server error (pending router)' });
	}
});
module.exports = router;
