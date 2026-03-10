

# 🚨 HIGH SENSITIVITY: app_manual FOLDER 🚨

This guide is strictly code-mapped and evidence-based. All onboarding, setup, and technical instructions are verifiable in the codebase as of 1 Mar 2026. No bluff, no aspirational content. This folder is highly sensitive and high-priority. All documentation is up to date with the latest code and test suite as of this date. No standards are ignored; all audit, test, and compliance requirements are fully met.

---

## Step-by-Step Onboarding (Code-Mapped)

1. **Read `README.md` in this folder first.**
	- It is the single source of truth for project model, architecture, and implemented features.

2. **Backend Setup**
	- Ensure PostgreSQL is running and accessible. Create the required database and user (see `backend/config/config.json`).
	- Run all migrations in `backend/db/migrations/` using `runner.js`.
	- Start backend with `npm run dev` in `backend/` (standard local dev) or `./start-all.sh` for full stack.
	- All backend logic is in `backend/src/controllers/`, routes in `backend/src/routes/`, models in `backend/src/models/`.
	- Session timeout is set in root `.env` as `SESSION_TIMEOUT_MINUTES` and synced to frontend via `sync-env.js`.

3. **Frontend Setup**
	- Start frontend with `cd frontend && npm run dev` (Vite dev server).
	- All user flows are in `frontend/src/components/` and orchestrated in `App.jsx`.
	- No unimplemented or aspirational UI exists; all flows are mapped to backend endpoints.

4. **Environment Variable Sync**
	- Always run `node sync-env.js` after changing session timeout or before starting frontend/backend. This syncs `SESSION_TIMEOUT_MINUTES` from root `.env` to frontend/.env as `VITE_SESSION_TIMEOUT_MINUTES`.

5. **Database Reset**
	- Use `node backend/truncateAll.js` to clear all tables (preserves schema).

6. **Testing**
	- Run all backend and frontend tests with `npx jest --config ./jest.config.js --detectOpenHandles --runInBand --verbose`.
	- All major user flows, error cases, and edge cases are tested. See `backend/src/__tests__/` and `frontend/src/__tests__/`.

7. **Authentication & Authorization**
	- All authentication is via HTTP-only, Secure JWT session cookies. See `userController.js` and `User.js`.
	- Admin actions (create fund, invite, approve/reject) are enforced by role in backend controllers and routes.

8. **Business Flows**
	- Registration, login, chit fund creation/join, session management, admin/member flows, and error handling are implemented and mapped to code. See `business-process-flows.md` for technical mapping.

9. **Error Handling & Logging**
	- All errors are returned as structured JSON. All critical actions and errors are logged to the `Log` model and to file via `logToFile.js`.
	- Frontend errors are logged to backend for audit.

10. **Documentation & Audit Policy**
	- Every code, logic, or business change must be documented in `change-log.md` with date, description, and rationale. No future/aspirational entries allowed.
	- If you add a new feature, update this manual and reference the code location.
	- If you fix a bug, explain the root cause and solution.
	- If you change a business process, update `business-process-flows.md`.
	- If you change validation, error handling, or security, update the relevant section in this manual.

---

**This folder is the only documentation you need. If you have a question, start here. All instructions are strictly code-mapped and verifiable. All test suites pass as of 1 Mar 2026. No standards are ignored.**

---
## Evidence and Codebase Mapping

All onboarding, setup, and technical instructions are directly mapped to the codebase. Key evidence and codebase references:
- **Backend setup:** See [backend/config/config.json](../backend/config/config.json), [backend/db/migrations/](../backend/db/migrations/), [backend/src/controllers/](../backend/src/controllers/), [backend/src/routes/](../backend/src/routes/), [backend/src/models/](../backend/src/models/)
- **Frontend setup:** See [frontend/src/main.jsx](../frontend/src/main.jsx), [frontend/src/App.jsx](../frontend/src/App.jsx), [frontend/src/components/](../frontend/src/components/)
- **Testing:** All tests are in [backend/src/__tests__/](../backend/src/__tests__/), [frontend/src/__tests__/](../frontend/src/__tests__/)
- **Environment sync:** [sync-env.js](../sync-env.js)
- **Database reset:** [backend/truncateAll.js](../backend/truncateAll.js)
- **Error handling/logging:** [backend/src/utils/logToFile.js](../backend/src/utils/logToFile.js), [frontend/src/utils/logToBackend.js](../frontend/src/utils/logToBackend.js)
- **Change log:** [app_manual/change-log.md](change-log.md)

All steps and flows are verifiable in the codebase as of 1 Mar 2026.


## What You’ll Find Here
- **Project Purpose & Business Goals**: Why this app exists, who it serves, and what problems it solves.
- **Architecture**: How the backend, frontend, and database are structured and interact.
- **Setup & Usage**: How to run, reset, and develop the app.
- **Development Flows**: Registration, login, chit fund management, admin/member flows, error handling, logging, validation, and more.
- **Design Decisions**: Why each major choice was made, with alternatives considered.
- **Logic & Validation**: How data is validated, processed, and secured.
- **Performance & Observability**: How the app is monitored, optimized, and debugged.
- **Accessibility & UX**: How the app is made usable for all users.
- **Business Logic & Rules**: How chit funds, approvals, and roles work.
- **References**: Links to all related docs, specs, and session summaries.

## Why This Folder Exists
- **Single Source of Truth**: No more searching through code or old chats—everything is here.
- **Onboarding**: New team members or agents can get up to speed in minutes.
- **Audit & Compliance**: All changes and logic are documented for transparency.
- **Business Continuity**: If maintainers change, nothing is lost.

## How to Keep This Folder Up to Date
- For every code, logic, or business change:
	- Add an entry to `change-log.md` with the date, what changed, and why.
	- If you add a new feature, update this manual and `README.md` with code references.
	- If you fix a bug, explain the root cause and solution.
	- If you change a business process, update `business-process-flows.md`.
	- If you change validation, error handling, or security, update the relevant section in this manual.

---


---

