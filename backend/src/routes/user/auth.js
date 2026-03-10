/**
 * User Authentication Routes
 * @module routes/user/auth
 */

/**
 * Check if a username is available
 * @route GET /api/user/check-username
 * @group User - Auth
 * @param {string} username.query.required
 * @returns {object} 200 - Username availability
 * @returns {Error}  400 - Missing username
 * @returns {Error}  500 - Failed to check username
 */
/**
 * Register a new user
 * @route POST /api/user/register
 * @group User - Auth
 * @param {string} username.body.required
 * @param {string} firstName.body.required
 * @param {string} lastName.body.required
 * @param {string} mobile.body.required
 * @param {string} password.body.required
 * @param {string} confirmPassword.body.required
 * @param {string} otp.body.required
 * @param {file} picture.formData.optional - Profile picture
 * @returns {object} 201 - User registered
 * @returns {Error}  400 - Validation error
 * @returns {Error}  500 - Failed to register
 */
/**
 * Login a user
 * @route POST /api/user/login
 * @group User - Auth
 * @param {string} username.body.required
 * @param {string} password.body.required
 * @returns {object} 200 - Login successful
 * @returns {Error}  400 - Validation error
 * @returns {Error}  401 - User not found or incorrect password
 * @returns {Error}  500 - Failed to login
 */
/**
 * Get current user session info
 * @route GET /api/user/me
 * @group User - Auth
 * @returns {object} 200 - User info
 * @returns {Error}  401 - Not authenticated or invalid session
 */
/**
 * Logout the current user
 * @route POST /api/user/logout
 * @group User - Auth
 * @returns {object} 200 - Logout successful
 * @returns {Error}  500 - Failed to logout
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../../controllers/userController');
const upload = require('../../middleware/profilePicUpload');
const validate = require('../../middleware/validate');


// Username check (no validation needed)
router.get('/check-username', userController.checkUsername);

// Registration with input validation
router.post(
	'/register',
	upload.single('picture'),
	validate([
		body('username').isString().isLength({ min: 3, max: 32 }).withMessage('Username must be 3-32 chars.'),
		body('firstName').isString().isLength({ min: 1, max: 32 }).withMessage('First name required.'),
		body('lastName').isString().isLength({ min: 1, max: 32 }).withMessage('Last name required.'),
		body('mobile').isString().isLength({ min: 10, max: 15 }).withMessage('Mobile must be 10-15 digits.'),
		body('password').isString().isLength({ min: 6 }).withMessage('Password must be at least 6 chars.'),
		body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords must match.'),
		body('otp').isString().isLength({ min: 1 }).withMessage('OTP required.')
		// Add more fields as needed
	]),
	userController.register
);

// Login with input validation
router.post(
	'/login',
	validate([
		body('username').isString().isLength({ min: 3, max: 32 }).withMessage('Username required.'),
		body('password').isString().isLength({ min: 6 }).withMessage('Password required.')
	]),
	userController.login
);


// Session check endpoint
router.get('/me', require('cookie-parser')(), userController.me);

// Logout endpoint
router.post('/logout', userController.logout);

module.exports = router;
