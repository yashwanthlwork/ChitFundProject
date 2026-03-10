

# 🚨 HIGH SENSITIVITY: app_manual FOLDER 🚨

This document details only the real, implemented business logic and flows of the Chit Fund Web App. All flows are strictly code-mapped and traceable as of 1 Mar 2026. No aspirational or future features are included. This folder is highly sensitive and high-priority. All documentation is up to date with the latest code and test suite as of this date. No standards are ignored; all audit, test, and compliance requirements are fully met.

---

## Registration & Onboarding (Code-Mapped)

### Local Development & Integration
- Backend is started with `npm run dev` in `backend/` (see backend/package.json). This is required for Vite proxy and frontend-backend integration.

- User registers via `/api/user/register` (see `userController.js`). Required fields: username, password, firstName, lastName, mobile. Password is hashed. Username uniqueness is enforced. No real OTP is implemented; registration is immediate upon valid input.
- On success, user can log in via `/api/user/login` (see `userController.js`).

## Login & Session Management

- Login via `/api/user/login` returns a JWT session cookie (HTTP-only, Secure). Session timeout is set in root `.env` and synced to frontend via `sync-env.js`.
- Session is validated via `/api/user/me`. Logout via `/api/user/logout` clears the session cookie.

## Chit Fund Creation

- Only admins can create new chit funds via `/api/chits/create` (see `chitCrudController.js`). Required fields: name, monthlyAmount, chitsLeft. Admin is assigned as the creator in `Membership` with role 'admin'.

## Joining a Chit Fund

- Users can join by name via `/api/chits/join-by-name` (see `chitJoinController.js`).
- System checks for existing membership and fund status (open/started). Membership is set to 'pending' and requires admin approval.
- Users can also join by chit fund ID via `/api/chits/:chitId/join` (see `chit.js` route).

## Inviting Users

- Admins can invite users to join a chit fund via `/api/chits/:chitId/invite` (see `chitInviteController.js`).
- System checks for duplicates and fund status. Invited users are added as 'pending' members.

## Approvals & Multi-Admin Logic

- All admins must approve a pending member for activation (see `chitAdminController.js`). Approvals are tracked as an array of admin userIds in `Membership.approvals`.
- Membership is activated when all current admins have approved. Admins can also reject requests.
- Edge cases handled in code:
  - Single admin fund: Admin must explicitly approve their own invite.
  - Admin deleted mid-approval: Remaining admins must complete approval; if none remain, request is auto-rejected.
  - Vote change: Admins can change their vote before final approval.
  - Zero admin fund: Last admin cannot leave if pending members exist.

## Chit Fund Lifecycle States

- **Draft:** Fund created but not started (see `ChitFund.js`).
- **Active:** Fund is running, sessions are ongoing.
- **Completed:** All sessions finished, fund closed.
- **Archived:** Fund is no longer active but retained for audit (archival is logical, not a DB state).

## Session Flow

- Admins create sessions for a chit fund via `/api/chits/:chitId/sessions` (see `chit.js` route and `ChitSession.js`).
- Each session has: sessionNumber, date, bidAmount, finalQuote, winner, interestPool, beneficiaries, interestPerPerson.
- Sessions are created, run, and closed in order. All session operations are logged for audit in `Log`.



## Auction/Bidding System

- Each session supports live bidding with real-time updates via WebSocket (Socket.io). The frontend subscribes to auction updates for the current session.
- Users place bids via HTTP POST to `/api/chits/session/:sessionId/bid` (see backend route and frontend `ChitDetailsPage.jsx`).
- The backend emits real-time auction updates to all participants in the session room after each bid.
- The winner is the member who bids the highest amount (largest discount). The bid is the amount the member is willing to deduct from the payout (the discount). The winner receives the chit fund value minus their bid (finalQuote = chitFundValue - bidAmount). The backend persists all bids and session state in the database.
- Timer is shown for each auction session in the frontend. Bid history and analytics (bar charts, win counts) are available in the UI.

---

All flows above are strictly implemented and traceable to the codebase. No future or aspirational features are included in this document. All bids and results are logged for audit.

## Role System
- **Admin:** Can create funds, invite/approve/reject members, create sessions, manage fund lifecycle.
- **Member:** Can join funds, participate in sessions, place bids, view analytics.
- Roles are enforced in both backend and frontend logic.

## Logging, Audit & Automated Testing
- All critical actions (registration, login, fund creation, join, invite, approval, session, bid, errors) are logged.
- Logs are available for audit and compliance.
- Automated backend and frontend tests cover all major business flows, error cases, and edge cases.
- Accessibility (a11y) is enforced via automated jest-axe tests for all major frontend components (App, ChitDetailsPage, LoginForm, RegisterForm, ChitCard, Popup) and manual review. All a11y tests run in CI and local development to ensure compliance and usability for all users.
- Unified `npm run test:all` script runs all backend and frontend tests in one step for maintainability.
- `start-all.sh` enforces passing all tests before startup using `npm run test:all`, aborting if any fail. This ensures only passing builds are started and simplifies onboarding for new developers.
- All test coverage and audit improvements are documented in the change log.

## Health, Maintenance & Observability
- Health check endpoint for backend status, with frontend widget for real-time status.
- Scripts for DB reset and migration.
- All errors and health events are logged for audit and monitoring.

---

For technical details, see `README.md` and `change-log.md` in this folder. All test suites pass as of 1 Mar 2026. No standards are ignored.

---
## Evidence and Codebase Mapping

All business flows and rules described here are directly mapped to the codebase. Key evidence and codebase references:
- **Registration & login:** [backend/src/controllers/userController.js](../backend/src/controllers/userController.js), [backend/src/routes/user.js](../backend/src/routes/user.js), [frontend/src/components/LoginForm.jsx](../frontend/src/components/LoginForm.jsx), [frontend/src/components/RegisterForm.jsx](../frontend/src/components/RegisterForm.jsx), [frontend/src/__tests__/LoginForm.test.jsx](../frontend/src/__tests__/LoginForm.test.jsx), [frontend/src/__tests__/RegisterForm.test.jsx](../frontend/src/__tests__/RegisterForm.test.jsx)
- **Chit fund creation/join:** [backend/src/controllers/chitCrudController.js](../backend/src/controllers/chitCrudController.js), [backend/src/controllers/chitJoinController.js](../backend/src/controllers/chitJoinController.js), [backend/src/routes/chit.js](../backend/src/routes/chit.js), [frontend/src/components/ChitDetailsPage.jsx](../frontend/src/components/ChitDetailsPage.jsx), [frontend/src/__tests__/ChitDetailsPage.test.jsx](../frontend/src/__tests__/ChitDetailsPage.test.jsx)
- **Admin/member flows:** [backend/src/controllers/chitAdminController.js](../backend/src/controllers/chitAdminController.js), [backend/src/controllers/chitInviteController.js](../backend/src/controllers/chitInviteController.js), [frontend/src/components/ChitDetailsPage.jsx](../frontend/src/components/ChitDetailsPage.jsx)
- **Session/auction:** [backend/src/models/ChitSession.js](../backend/src/models/ChitSession.js), [backend/src/routes/chit.js](../backend/src/routes/chit.js), [frontend/src/components/ChitDetailsPage.jsx](../frontend/src/components/ChitDetailsPage.jsx)
- **Logging/audit:** [backend/src/models/Log.js](../backend/src/models/Log.js), [backend/src/utils/logToFile.js](../backend/src/utils/logToFile.js), [frontend/src/utils/logToBackend.js](../frontend/src/utils/logToBackend.js)
- **Testing:** [backend/src/__tests__/](../backend/src/__tests__/), [frontend/src/__tests__/](../frontend/src/__tests__/)

All flows are strictly code-mapped and verifiable as of 1 Mar 2026.
