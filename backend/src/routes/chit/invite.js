const express = require('express');
const router = express.Router();
const chitInviteController = require('../../controllers/chitInviteController');
const gateway = require('../../middleware/gateway');

// POST /api/chits/:chitId/invite
router.post('/:chitId/invite', gateway, chitInviteController.inviteUser);

module.exports = router;
