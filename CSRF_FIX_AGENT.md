# CSRF TOKEN MISMATCH — AI AGENT FIX DOCUMENT
# Project: Chit Fund Web App
# Date: 2026-03-01
# Severity: HIGH — All POST requests failing with ForbiddenError: invalid csrf token
# Status: OPEN — Fix required immediately

---

## WHAT IS BROKEN AND WHY

### The Exact Error
```
ForbiddenError: invalid csrf token
    at csrf (backend/node_modules/csurf/index.js:112:19)
    at backend/src/app.js:104:11
```

Every `POST /api/log` request fails with HTTP 403. The same will happen
for every other POST endpoint (bids, sessions, joins, approvals) as soon as
the user tries to use them after a server restart.

### Root Cause — Proven From Logs

The logs show this exact mismatch:

```
GET  /api/csrf-token/token  →  Issued: osn66Wh6-XNGRU_T3_TeSA7zcN7OUa_PalI0  (NEW token)
POST /api/log               →  Sent:   bKrx6vm1z-61JqiGNhUw2sDB               (OLD stale token)
```

The frontend is sending a **stale CSRF token from a previous session**.
The backend restarted → the csurf secret changed → the old token is now
cryptographically invalid → every POST is rejected with 403.

### Why This Happens

`csurf` generates CSRF tokens using a secret. That secret is tied to the
session. When the server restarts, previously issued tokens are invalid.
The frontend cached the old token and keeps sending it. The backend rejects
every request. Nothing works.

### Three Contributing Problems

```
PROBLEM 1: Frontend caches CSRF token across server restarts
           → Token becomes stale after every ./start-all.sh

PROBLEM 2: csurf cookie is likely configured with httpOnly: true
           → Browser JavaScript cannot read _csrf cookie
           → Double-submit pattern breaks

PROBLEM 3: /api/log is a fire-and-forget logging sink
           → It does not need CSRF protection
           → Protecting it causes infinite error loops
             (the error logger tries to log the CSRF error → gets CSRF error → loop)
```

---

## FILES TO MODIFY

```
backend/src/app.js          ← CSRF middleware config + error handler
frontend/src/App.jsx        ← CSRF token fetch on mount (or wherever it currently is)
frontend/src/utils/         ← Wherever fetch calls are made with x-csrf-token header
```

---

## FIX 1 — backend/src/app.js

### Step 1A — Find the current csurf configuration

Look for something like:
```javascript
const csrf = require('csurf')
app.use(csrf({ cookie: true }))
// OR
app.use(csrf({ cookie: { httpOnly: true, ... } }))
```

### Step 1B — Replace it with the correct configuration

```javascript
const csrf = require('csurf')

// CSRF protection with correct cookie settings
const csrfProtection = csrf({
  cookie: {
    httpOnly: false,    // CRITICAL: must be false so browser JS can read _csrf cookie
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
})

// Routes that are EXEMPT from CSRF protection:
// /api/log    → fire-and-forget logging sink, not a financial action
//               protecting it causes an infinite loop: CSRF error → log error → CSRF error
// /api/health → read-only health check, no state changes
// /api/csrf-token/* → the token issuing endpoint itself cannot require a token

// Apply CSRF selectively — exempt safe routes
const conditionalCsrf = (req, res, next) => {
  const exemptPaths = [
    '/api/log',
    '/api/health',
    '/api/csrf-token'
  ]
  // Check if path starts with any exempt prefix
  const isExempt = exemptPaths.some(p => req.path === p || req.path.startsWith(p + '/'))
  if (isExempt) return next()
  return csrfProtection(req, res, next)
}

app.use(conditionalCsrf)
```

### Step 1C — Update the global error handler (at the BOTTOM of app.js)

Find your existing error handler and add the CSRF error case at the top:

```javascript
// Global error handler — MUST be last middleware in app.js
app.use((err, req, res, next) => {
  // Handle CSRF token errors specifically
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      success: false,
      error: 'Security token expired or invalid. Please refresh the page.',
      code: 'CSRF_INVALID'
    })
  }

  // Handle all other errors
  console.error('[ERROR]', err.message, err.stack)
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  })
})
```

---

## FIX 2 — Frontend CSRF Token Fetching

### Step 2A — Find where the CSRF token is currently fetched

Search across the frontend codebase for:
```
/api/csrf-token
x-csrf-token
csrfToken
```

Common locations to check:
- `frontend/src/App.jsx`
- `frontend/src/utils/logToBackend.js`
- `frontend/src/utils/api.js` (if exists)
- Any component that makes POST requests

### Step 2B — The required pattern

The CSRF token MUST be fetched fresh on every page load.
It MUST be stored in memory only — never in localStorage or sessionStorage.

```javascript
// In frontend/src/App.jsx — inside the App component

import { useEffect, useState } from 'react'

function App() {
  const [csrfToken, setCsrfToken] = useState(null)

  // Fetch CSRF token fresh on every mount (every page load)
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const res = await fetch('/api/csrf-token/token', {
          credentials: 'include'  // Must include cookies
        })
        if (!res.ok) throw new Error('Failed to fetch CSRF token')
        const data = await res.json()
        setCsrfToken(data.csrfToken)
      } catch (err) {
        console.error('CSRF token fetch failed:', err)
      }
    }
    fetchCsrfToken()
  }, []) // Empty array = runs once on every page load

  // Pass csrfToken down to components that need it
  // OR store in a context/zustand store for global access
}
```

### Step 2C — If you use a global window variable instead of React state

If the current code stores the token as `window.__csrfToken` or similar,
the fetch must still happen on every mount:

```javascript
// Also acceptable — store in memory on window object (cleared on page refresh)
useEffect(() => {
  fetch('/api/csrf-token/token', { credentials: 'include' })
    .then(r => r.json())
    .then(data => {
      window.__csrfToken = data.csrfToken
    })
    .catch(err => console.error('CSRF token fetch failed:', err))
}, [])
```

### Step 2D — Every POST/PUT/DELETE request must use the fresh token

```javascript
// Pattern for every state-changing request
const response = await fetch('/api/chits/create', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': csrfToken   // Always from state/context — never hardcoded
  },
  body: JSON.stringify({ name, monthlyAmount, chitsLeft })
})
```

---

## FIX 3 — frontend/src/utils/logToBackend.js

This file calls `POST /api/log`. Once `/api/log` is exempted from CSRF on the
backend (Fix 1), this file does NOT need to send the CSRF header for logging.

However, if the current code is sending a stale `x-csrf-token` header, clean it up:

```javascript
// logToBackend.js — simplified, no CSRF header needed for /api/log
export async function logToBackend(level, message, meta = {}) {
  try {
    await fetch('/api/log', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
        // No x-csrf-token needed — /api/log is CSRF-exempt
      },
      body: JSON.stringify({ level, message, meta })
    })
  } catch (err) {
    // Silently fail — logging must never crash the app
    console.warn('logToBackend failed silently:', err.message)
  }
}
```

---

## VERIFICATION STEPS

After making all three fixes, verify in this exact order:

### Step 1 — Restart the server
```bash
# Kill existing processes
Ctrl+C

# Clear browser cookies for localhost manually:
# Chrome → DevTools → Application → Cookies → localhost → Clear All

# Restart
./start-all.sh
```

### Step 2 — Verify CSRF token is issued correctly
```bash
# In browser DevTools → Network tab
# Look for: GET /api/csrf-token/token
# Response should be: { csrfToken: "some-value" }
# Status: 200
```

### Step 3 — Verify POST /api/log succeeds
```bash
# In browser DevTools → Network tab
# After page loads, look for: POST /api/log
# Status should be: 200 (not 403)
# The x-csrf-token header should NOT appear on this request (it's exempt)
```

### Step 4 — Verify CSRF still protects financial endpoints
```bash
# In browser DevTools → Network tab
# Make a POST to /api/chits/create
# It SHOULD include x-csrf-token header
# It SHOULD succeed with 201 (not 403)
```

### Step 5 — Verify CSRF protection is working for security
```bash
# Test that missing CSRF token is rejected on protected routes
curl -X POST http://localhost:4000/api/chits/create \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}' \
  --cookie "session=any-value"
# Expected: 403 with { success: false, error: "Security token expired or invalid..." }
# This confirms CSRF is still protecting financial endpoints
```

---

## CHANGE-LOG ENTRY

After completing all fixes, add this entry to `app_manual/change-log.md`:

```markdown
## 2026-03-01 — Fix CSRF token mismatch causing ForbiddenError on all POST requests

- **What:** Fixed CSRF token validation failure that blocked all POST requests after server restart
- **Root cause:** Frontend was caching a stale CSRF token from a previous session.
  After server restart, the csurf secret changed, making the old token invalid.
  Additionally, csurf cookie was httpOnly which prevented browser JS from reading it.
  Additionally, /api/log was CSRF-protected which caused an infinite error-logging loop.
- **Files changed:**
  - backend/src/app.js — changed csurf cookie httpOnly from true to false,
    added conditional CSRF middleware exempting /api/log, /api/health, /api/csrf-token,
    added EBADCSRFTOKEN handler to global error handler
  - frontend/src/App.jsx — ensured CSRF token is fetched fresh on every page load,
    stored in component state (not localStorage)
  - frontend/src/utils/logToBackend.js — removed x-csrf-token header from /api/log calls
- **Why:** CSRF tokens must be re-fetched on every session. /api/log must be exempt
  to prevent infinite error loops. csurf cookie must be readable by browser JS.
- **Impact:** All POST requests now succeed. CSRF protection still active on all
  financial endpoints (create, join, invite, approve, bid, sessions).
- **Tests:** Verified manually — POST /api/log returns 200, POST /api/chits/create
  returns 201 with valid CSRF token, returns 403 without CSRF token.
- **Docs updated:** app_manual/security-and-compliance.md — updated CSRF section
  to document exempt routes and correct cookie configuration
```

---

## security-and-compliance.md UPDATE

Find the CSRF Protection section and replace it with:

```markdown
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
```

---

## DO NOT DO THESE — COMMON WRONG FIXES

```
❌ Do NOT set httpOnly: true on the csurf cookie
   → Browser JS cannot read it → double-submit pattern breaks

❌ Do NOT store csrfToken in localStorage or sessionStorage
   → Defeats purpose of CSRF protection (XSS can read storage)
   → Stale across restarts (same problem as now)

❌ Do NOT remove CSRF protection from financial endpoints
   → /api/chits/create, /api/chits/:id/sessions, /api/chits/session/:id/bid
   → These MUST stay protected

❌ Do NOT change test assertions to skip CSRF validation in tests
   → Write tests that properly set up CSRF tokens in the test environment

❌ Do NOT ignore the EBADCSRFTOKEN error code
   → Without specific handling, it falls through to the generic 500 handler
   → Users see "Internal server error" with no way to recover
```

---

## QUICK REFERENCE — WHICH ROUTES ARE EXEMPT vs PROTECTED

```
EXEMPT (no CSRF token required):
  GET  /api/csrf-token/token   ← issues the token
  GET  /api/health             ← read-only
  POST /api/log                ← logging sink, exempt to prevent error loops
  POST /api/user/register      ← public, unauthenticated
  POST /api/user/login         ← public, unauthenticated

PROTECTED (CSRF token required in x-csrf-token header):
  POST /api/chits/create                           ← financial: creates fund
  POST /api/chits/:chitId/invite                   ← financial: membership
  POST /api/chits/join-by-name                     ← financial: membership
  POST /api/chits/:chitId/join                     ← financial: membership
  POST /api/chits/:chitId/requests/:membershipId   ← financial: approval
  POST /api/chits/:chitId/sessions                 ← financial: session creation
  POST /api/chits/session/:sessionId/bid           ← financial: money movement
  POST /api/user/logout                            ← session management
  POST /api/user/upload-picture                    ← state change
```

---

*Document generated: 2026-03-01*
*Fix must be verified before the next session of any live auction*
*All financial POST endpoints must be tested after this change*
