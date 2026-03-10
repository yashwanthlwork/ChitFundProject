
# API Specification

### GET /api/csrf-token/token
- Get a CSRF token for use in mutating requests (POST/PUT/DELETE).
- Returns: `{ csrfToken: <token> }`

## Local API Testing & Integration
- Backend API is accessible at http://localhost:4000 when started with `npm run dev` in `backend/`. This is required for all /api/ endpoint testing and frontend integration (see backend/package.json).

This document describes all REST API endpoints, request/response formats, authentication, and error handling for the Chit Fund Web App backend. It is always kept in sync with the codebase.

---

## Authentication
- **All protected endpoints require authentication via HTTP-only, Secure JWT session cookies.**
- Registration and login do not require authentication.
- The `x-username` header is deprecated and must not be used (removed Feb 2026).

## Error Handling
- All errors return JSON: `{ success: false, error: <message>, details?: <array|string> }`

---

## User Endpoints

### POST /api/user/register
- Register a new user.
- Body: `{ username, firstName, lastName, mobile, password, confirmPassword, otp, picture? }`
- ⚠️ **SIMULATED OTP:** The `otp` field is required but any value is accepted. Real OTP integration is planned for production. Do not implement client-side OTP validation logic based on this field.
- Returns: `{ id, username, picture, guid }`

### POST /api/user/login
- Login with username and password.
- Body: `{ username, password }`
- Returns: `{ id, username, guid }` and sets a JWT session cookie.

### GET /api/user/check-username?username=foo
- Check if a username is available.
- Returns: `{ available: true|false }`

### GET /api/user/me
- Get current user session info (requires JWT cookie).
- Returns: `{ id, username, firstName, lastName, mobile, picture, guid }`

### POST /api/user/logout
- Logout the current user (clears JWT session cookie).
- Returns: `{ success: true }`

### POST /api/user/upload-picture
- Upload a profile picture (multipart/form-data, authenticated).
- Body: `picture` (file)
- Returns: `{ success: true, picture: <url> }`

---

## Chit Fund Endpoints

### POST /api/chits/create
- Create a new chit fund (admin only).
- Body: `{ name, monthlyAmount, chitsLeft }`
- Returns: `{ success: true, chitFund, guid }`

### GET /api/chits/list
- List all chit funds for the logged-in user.
- Returns: `[ { chitFund, role } ]`

### POST /api/chits/:chitId/invite
- Invite a user to a chit fund (admin only).
- Body: `{ username }`
- Returns: `{ success: true }`

### POST /api/chits/join-by-name
- Join a chit fund by name.
- Body: `{ name }`
- Returns: `{ success: true }`

### GET /api/chits/pending-join-requests
- List all pending join requests for admin.
- Returns: `[ { membershipId, chitFund, user, requestedAt, approvals, admins } ]`

### POST /api/chits/:chitId/requests/:membershipId
- Approve or reject a join request (admin only).
- Body: `{ action: 'approve' | 'reject' }`
- Returns: `{ success: true, allApproved?: boolean }`

### GET /api/chits/:chitId/details
- Get chit fund details, session history, and statistics.
- Returns: `{ chitFund, sessions, stats, members }`

### GET /api/chits/all-memberships
- Get all chit fund memberships for the current user.
- Returns: `[ { chitFund, role, status, createdAt } ]`

### POST /api/chits/:chitId/join
- Request to join a chit fund by ID.
- Returns: `{ success: true }`

### GET /api/chits/session/:sessionId/live
- Get live session info by sessionId.
- Returns: `{ id, chitFundId, sessionNumber, date, bidAmount, finalQuote, winnerId, winnerGets, interestPool, beneficiaries, interestPerPerson, isCompleted, lastBidTime, lastBidder, currentBid, participants }`


### POST /api/chits/session/:sessionId/bid
- Place a bid in a live chit session (authenticated).
- Body: `{ amount }`
- Returns: `{ success: true, bid: { user, amount }, winner: { user, amount, time } }`
- Errors:
	- 401: Not authenticated
	- 400: Invalid bid amount or session is already completed
	- 404: Session not found
	- 500: Failed to place bid

### POST /api/chits/:chitId/sessions
- Create new session(s) for a chit fund (admin only).
- Body: `{ sessionNumber, date, bidAmount?, finalQuote?, winnerName?, winnerGets?, interestPool?, beneficiaries?, interestPerPerson }`
- Returns: `{ success: true }`

---

## Logging & Health

### POST /api/log
- Log a message from the frontend.
- Body: `{ level, message, meta }`
- Returns: `{ success: true }`

### GET /api/health
- Health check endpoint.
- Returns: `{ ok: true|false, db: 'up'|'down' }`

---

For more details, see code in `backend/src/routes/` and `backend/src/controllers/`.
