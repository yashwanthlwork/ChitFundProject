# Chit Fund Web App

Modern web app for managing chit funds.

## Features
- Robust backend: error handling, logging, migration automation, schema alignment
- Frontend: modern login/register forms, chit creation modal, vertical scrollable grid, responsive design, unified input/button styles, fade overlays
- Registration: username, first/last name, mobile, password, confirm password, OTP (simulated)
- Database: easy reset/truncate for fresh start
- **Strict linting and static analysis**: ESLint with strict rules for both backend and frontend
- **Automated tests**: Jest for backend and frontend, with React Testing Library for UI
- **No async/test leaks**: All async resources (fetch, DB, timers) are cleaned up; tests exit cleanly
**CI-ready**: No warnings, hangs, or open handles; robust for continuous integration

## System Architecture (Single Source of Truth)

```mermaid
graph TB
	U([👤 User Browser]) <-->|HTTPS / HTTP| FE[Frontend\nReact 18 + Vite\nSPA]

	FE <-->|HTTP-only JWT\nSession Cookie| AUTH[Auth Middleware\nJWT Validation]
	AUTH --> BE[Backend\nNode.js + Express\nREST API]

	FE <-.->|HTTP Polling\n⚠️ Replace with WS| BE

	BE <-->|Sequelize ORM\nParameterized Queries| DB[(PostgreSQL 16\nPrimary DB)]

	BE -->|logToFile.js\n⚠️ Replace with Pino| LOG[Flat File Logs\n⚠️ No rotation]

	BE <-->|express.static\n⚠️ No CDN| UPL[/uploads/\nprofile-pics]

	SE[sync-env.js\n⚠️ Antipattern] -->|SESSION_TIMEOUT_MINUTES| FEE[frontend/.env\n⚠️ Generated file]

	FE -->|POST /api/log\nError logging| BE

	BE -->|GET /api/health\nDB status check| HC[Health Check\nResponse]

	style U fill:#1976d2,color:#fff
	style FE fill:#42a5f5,color:#fff
	style BE fill:#1565c0,color:#fff
	style DB fill:#90caf9,color:#1565c0
	style LOG fill:#ffb74d,color:#000
	style UPL fill:#ffb74d,color:#000
	style SE fill:#ef5350,color:#fff
	style FEE fill:#ef5350,color:#fff
```

Items marked ⚠️ are existing problems to be fixed. This diagram is now both the textual AND visual architecture. The SVG and TXT diagram files have been deleted. This is the only source of architectural truth.

## Setup
1. Ensure PostgreSQL is running and accessible
2. Set your session timeout in the root `.env` file (see below for secure env management).
3. Run `node sync-env.js` to sync SESSION_TIMEOUT_MINUTES to frontend/.env before starting servers (or add to your npm scripts/prebuild step).
4. Run `./start-all.sh` to start backend, run migrations, and launch frontend
5. Access frontend at http://localhost:5173/
6. To run all tests: `npx jest --config ./jest.config.js --detectOpenHandles --runInBand --verbose`
	- All tests should pass and Jest should exit cleanly (exit code 0)


## Secure Environment Variable Management

**Best Practice:**
- Only sync non-sensitive variables to frontend.

| JWT_SECRET               | backend/.env     | Backend    | 256-bit+ random string, never committed          |
| VITE_SESSION_TIMEOUT_MINUTES | frontend/.env | Frontend   | Synced from root .env by sync-env.js             |

**To change session timeout:**
1. Edit `SESSION_TIMEOUT_MINUTES=...` in the root `.env` file.
2. Run `node sync-env.js` (or add to your npm prebuild step).

- Backend CORS is configured to allow requests only from the frontend origin (e.g., http://localhost:5173) with credentials: true.

## JWT Secret Management & Cookie Flags
- Logout clears the cookie; tokens are stateless and expire naturally (see security-and-compliance.md for details).

- See security-and-compliance.md for details and rationale.

---
## Registration Flow
- Collects username, first name, last name, mobile, password, confirm password, OTP
- OTP is simulated (not real SMS/email integration yet)
## Next Steps
- Further polish registration and chit fund flows

- Enabled strict linting and fixed all lint errors (backend & frontend)
- Polyfilled fetch, TextEncoder, and XMLHttpRequest for robust frontend testing
- Ensured all async resources (fetch, timers, DB) are cleaned up in tests
- Closed Sequelize DB connection after backend tests to prevent Jest hangs
- All tests now pass with no warnings, leaks, or hangs (CI-ready)

This section tracks ongoing and future test coverage for the entire project. Update as new features/tests are added.

- [ ] Test all backend routes
	- Add and run Jest/Supertest tests for all backend API endpoints (CRUD, user, chit, etc.) in backend/src/routes/.
- [ ] Test backend controllers/models
	- Add unit/integration tests for backend controllers and models, including DB logic and error handling.
- [ ] Test DB migration scripts
	- Add tests to verify DB migration scripts (up/down) in backend/db/migrations/.
- [ ] Test backend utility scripts
	- Add tests for backend utility scripts like truncateAll.js and any helpers in backend/src/utils/.
- [ ] Test all frontend components
	- Add React Testing Library tests for all frontend components (LoginForm, RegisterForm, ChitGrid, Popup, etc.) in frontend/src/components/.
- [ ] Test frontend utilities
	- Add tests for custom frontend utilities (e.g., logToBackend.js).


## Structure
- backend: Node.js + Express + PostgreSQL
- frontend: React
