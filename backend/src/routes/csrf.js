const express = require('express');
const router = express.Router();


// This route issues a CSRF token and returns it in JSON (route-level csurf for GET only)
const csurf = require('csurf');
router.get('/token', csurf({ cookie: true }), (req, res) => {
  // Debug: print CSRF cookie value
  const cookieHeader = req.headers.cookie || '';
  const parsedCookies = req.cookies || {};
  const csrfCookie = parsedCookies._csrf || '(not set)';
  console.log(`[CSRF DEBUG] /api/csrf-token/token GET`);
  console.log(`[CSRF DEBUG] Incoming Cookie header:`, cookieHeader);
  console.log(`[CSRF DEBUG] Parsed cookies:`, parsedCookies);
  // The new CSRF token (will be set as cookie by csurf)
  const token = req.csrfToken();
  console.log(`[CSRF DEBUG] Issued CSRF token:`, token);
  res.json({ csrfToken: token });
});

module.exports = router;
