const express = require('express');
const router = express.Router();
const chitJoinController = require('../../controllers/chitJoinController');
const gateway = require('../../middleware/gateway');

// POST /api/chits/join-by-name

// Defensive: ensure envelope for all error cases
router.post('/join-by-name', gateway, async (req, res, next) => {
	try {
		await chitJoinController.joinByName(req, res);
		if (!res.headersSent) {
			return res.status(500).json({ success: false, error: 'Unknown error occurred in join handler' });
		}
	} catch (err) {
		next(err);
	}
});

module.exports = router;
