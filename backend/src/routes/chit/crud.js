const express = require('express');
const router = express.Router();
const chitCrudController = require('../../controllers/chitCrudController');
const { createChitRules, validateChit } = require('../../middleware/chitValidation');
const authenticate = require('../../middleware/authenticate');

// Helper to wrap async controller calls and preserve Express context
function asyncHandler(fn) {
  return function(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}


// Aliases for legacy/test compatibility (must use async wrappers)
router.post('/crud/create', authenticate, validateChit(createChitRules), asyncHandler(chitCrudController.createChitFund));
router.get('/crud/list', authenticate, asyncHandler(chitCrudController.listUserChits));

// Create a new chit fund with input validation
router.post('/create', authenticate, validateChit(createChitRules), asyncHandler(chitCrudController.createChitFund));

// List all chit funds for the logged-in user
router.get('/list', authenticate, asyncHandler(chitCrudController.listUserChits));

// Catch-all error handler for unmatched routes or errors
router.use((err, req, res, next) => {
  const logToFile = require('../../utils/logToFile');
  logToFile('[ERROR][crud-router][unhandled]', { error: err?.message, stack: err?.stack, path: req.originalUrl });
  if (!res.headersSent) {
    res.status(500).json({ success: false, error: 'Internal server error (crud router)' });
  }
});
module.exports = router;
