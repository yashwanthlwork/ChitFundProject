// Centralized input validation middleware using express-validator
// Easily extendable for future fields and routes
const { validationResult } = require('express-validator');

module.exports = function validate(rules) {
  return [
    ...rules,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Never leak sensitive info
        return res.status(400).json({ success: false, error: 'Invalid input', details: errors.array().map(e => e.msg) });
      }
      return next();
    }
  ];
};
