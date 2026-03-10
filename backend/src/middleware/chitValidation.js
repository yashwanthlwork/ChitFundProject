// Centralized chit fund input validation middleware using express-validator
// Easily extendable for future chit fund fields and routes
const { body, validationResult } = require('express-validator');

const createChitRules = [
  body('name').exists({ checkNull: true }).isLength({ min: 3, max: 64 }).withMessage('Chit name must be 3-64 chars.'),
  body('monthlyAmount').exists({ checkNull: true }).toInt().isInt({ min: 1 }).withMessage('Monthly amount must be a positive integer.'),
  body('chitsLeft').exists({ checkNull: true }).toInt().isInt({ min: 1 }).withMessage('Chits left must be a positive integer.')
  // Add more fields as needed
];

function validateChit(rules) {
  return [
    ...rules,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: 'Invalid chit fund input', details: errors.array().map(e => e.msg) });
      }
      return next();
    }
  ];
}

module.exports = { createChitRules, validateChit };
