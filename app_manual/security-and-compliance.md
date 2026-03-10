
# Security & Compliance

This document details all security, privacy, and compliance measures in the Chit Fund Web App. It is regularly updated to reflect the current implementation and audit requirements.

---

## Authentication & Authorization

## Secure Startup & Audit Traceability
- Backend startup is standardized via `npm run dev` (backend/package.json). This ensures consistent, auditable local development and integration with frontend proxy.
- **Current Model:** All sensitive endpoints require authentication via HTTP-only, Secure JWT session cookies. The `x-username` header is deprecated as of Feb 2026 and must not be used for authentication. (Deprecation notice: x-username header was removed in Feb 2026; see change-log.md)
- **Login:** POST /api/user/login issues a JWT session cookie.
- **Session Validation:** GET /api/user/me checks session validity.
- **Logout:** POST /api/user/logout clears the session cookie.
- **Admin Actions:** Only admins (verified by adminUsername) can create funds, invite, or approve/reject members. All admin logic uses adminUsername, not display name.
- **Password Security:** Passwords are hashed with bcryptjs; never stored in plaintext.

## JWT Security Configuration
- **JWT_SECRET:** Must be a minimum 256-bit random string, stored in backend/.env only. Never committed to version control.
- **Expiry:** JWT exp claim matches SESSION_TIMEOUT_MINUTES.
- **Rotation:** If JWT_SECRET is missing, the backend refuses to start. Key rotation is manual and only on compromise (no automated rotation).
- **Logout:** Logout clears the cookie; tokens are stateless and expire naturally. **Token blacklist is not implemented.**

## CORS Policy
- **Frontend/Backend Separation:** CORS is configured to allow requests only from the frontend origin (e.g., http://localhost:5173) with credentials: true.
- **Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS.
- **Preflight:** OPTIONS preflight requests are handled.
- **No Wildcard Origin:** Wildcard origin (*) is never used with credentials: true.

## Rate Limiting
- **Global API Limit:** All /api/ routes are limited to 100 requests per 15 minutes per IP (backend/src/app.js, express-rate-limit).
- **Login:** Max 5 requests per 15 minutes per IP (can be further restricted in user/auth.js).
- **Register:** Max 3 requests per hour per IP (can be further restricted in user/auth.js).
- **Bids:** Max 10 requests per minute per user (can be further restricted in chit.js).
- **Logs:** Max 30 requests per minute per IP (can be further restricted in log.js).
- **Implementation:** express-rate-limit is used to enforce these limits on backend endpoints.

## CSRF Protection

- **Status:** Implemented — csurf middleware on all state-changing routes
- **Implementation:** backend/src/app.js — conditional CSRF middleware
- **Cookie config:** httpOnly: false (required for double-submit pattern),
	secure: true (production only), sameSite: strict
- **Protected routes:** All POST/PUT/PATCH/DELETE under /api/ except exempt list below
- **Exempt routes (intentional, documented):**
	- POST /api/log — fire-and-forget logging sink; protecting it causes
		infinite loop when CSRF errors are logged
	- GET /api/health — read-only, no state changes
	- GET /api/csrf-token/* — token issuing endpoint cannot require a token
- **Frontend handling:** CSRF token fetched fresh on every page load via
	GET /api/csrf-token/token, stored in React state (memory only),
	sent as x-csrf-token header on all protected requests
- **Error response:** 403 with code CSRF_INVALID and human-readable message
	"Security token expired or invalid. Please refresh the page."

## File Upload Security
- **Allowed Types:** Only image/jpeg, image/png, image/gif are accepted.
- **Max File Size:** 5MB per upload.
- **Filename Sanitization:** All uploaded files are renamed using uuid or hash; original filenames are never used.
- **Content-Type Validation:** Both extension and Content-Type header are checked.
- **Storage Path:** Profile pictures are stored in /uploads/profile-pics, outside the public web root.
- **Serving Files:** Files are served with correct Content-Disposition headers to prevent inline execution.

## Input Validation & Sanitization
- All user input is validated on both frontend and backend.
- Express-validator middleware prevents invalid or malicious data.

## Error Handling
- Centralized error handler never leaks stack traces or sensitive info to clients.
- All errors are logged for audit.

## Logging & Audit Trail
- All critical actions are logged to file (backend) and can be reviewed.
- Frontend can log to backend for unified audit.
- **Log Redaction:** Sensitive fields (password, confirmPassword, otp, jwt, cookies, authorization headers) are never logged. Central sanitize middleware is used for log redaction.

## Data Privacy
- No sensitive data is exposed in API responses.
- Profile pictures are stored with unique filenames and sanitized paths.


## Patched Vulnerabilities
- **Feb 18 2026:** Admin authorization now uses chitFund.adminUsername for all checks (not display name). Regression test added to backend/src/__tests__/routes.test.js.

- All flows are transparent and traceable.
- **Security Headers:** All HTTP responses are protected by helmet.js (see backend/src/app.js).
- **CSRF Protection:** All state-changing backend routes are protected by csurf middleware (see backend/src/app.js).
- **Cookie Flags:** All session cookies are set with HttpOnly, Secure, and SameSite=Lax.
- **Session Fixation Protection:** New session is generated after login.
- **SQL Injection Protection:** All DB queries use Sequelize parameterized queries.
- **Data Retention Policy:** User data is retained as long as the account is active. On account deletion, all personal data is purged except for audit logs (required for compliance).
- **Dependency Security:** npm audit is run regularly; known vulnerabilities are tracked and patched.

## TODO
- Add automated tests to verify security headers (helmet.js) and CSRF protection (csurf) are enforced on all relevant endpoints.
- Implement JWT blacklist on logout to immediately invalidate tokens (currently not implemented; tokens expire naturally).

## Not Implemented (as of 1 Mar 2026)
- **HTTPS Enforcement:** HTTP is NOT automatically redirected to HTTPS in production. This must be handled by deployment infrastructure (e.g., reverse proxy, cloud config).
- **Backup & Recovery:** Automated DB backups and restore procedures are NOT implemented in codebase. Manual backups may be performed at the DB level, but no automation exists.
- **Token Blacklist:** JWT token blacklist on logout is NOT implemented. Tokens expire naturally.
- Any other security features not explicitly listed above are not present in the codebase.

---

For more, see `README.md` and `change-log.md` in this folder.
