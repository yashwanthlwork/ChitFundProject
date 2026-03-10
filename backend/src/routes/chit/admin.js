const express = require('express');
const router = express.Router();
const chitAdminController = require('../../controllers/chitAdminController');
const gateway = require('../../middleware/gateway');

// POST /api/chits/:chitId/requests/:membershipId
router.post('/:chitId/requests/:membershipId', gateway, chitAdminController.handleRequestAction);

module.exports = router;
