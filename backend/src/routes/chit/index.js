// Combines all chit-related routes
const express = require('express');
const router = express.Router();

// Import sub-routers


const adminRoutes = require('./admin');
const crudRoutes = require('./crud');
const inviteRoutes = require('./invite');
const joinRoutes = require('./join');
const pendingRoutes = require('./pending');


router.use(joinRoutes);
router.use(pendingRoutes);
router.use(inviteRoutes);
router.use(adminRoutes);
router.use(crudRoutes);

module.exports = router;
