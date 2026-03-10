# GitHub Copilot Instructions — Chit Fund Web App
# Global Production Standard | Zero Tolerance for Negligence
# Place this file at: .github/copilot-instructions.md
# VS Code reads this file automatically for every Copilot Chat session in this workspace.
# Last updated: 2026-03-04

---

## 🚨 RULE ZERO — READ THIS BEFORE ANYTHING ELSE

This file is your complete operating manual. You are not allowed to skip sections.
You are not allowed to partially comply. Every rule here is a hard requirement.

**The moment you open a new session, do this in order — no exceptions:**

```
STEP 1: Read app_manual/README.md                  ← architecture, features, test status
STEP 2: Read app_manual/change-log.md              ← every change ever made and why
STEP 3: Read app_manual/business-process-flows.md  ← all domain rules, code-mapped
STEP 4: Read app_manual/security-and-compliance.md ← security posture, known gaps
STEP 5: Read app_manual/api-spec.md                ← all endpoints, auth, schemas
STEP 6: Read app_manual/guide-for-new-developers.md ← setup, env, tooling
```

If you skip this step:
- You will contradict decisions already made
- You will duplicate code that already exists
- You will document features that are not implemented
- You will break things that are working
- Everything you produce will need to be redone

**This is not a suggestion. Skip it and every output you produce is invalid.**

---

## 🔴 THE NON-NEGOTIABLE DOCUMENTATION LAW

**Every single change — no exceptions, no matter how small — triggers this protocol.**
Fixing a typo in a comment? Document it. Changing a variable name? Document it.
Adding a console.log temporarily? Document it when you remove it.

### The protocol — execute every step, in order, before saying "done":

```
STEP 1: Open app_manual/change-log.md
STEP 2: Add ONE entry at the VERY TOP under today's date
STEP 3: Fill in all required fields — see format below
STEP 4: Save change-log.md
STEP 5: Use the trigger table below — check which other files need updating
STEP 6: Update every file flagged by the trigger table
STEP 7: Verify no dead links were introduced in any updated file
STEP 8: Say to the user: "change-log updated ✅ | docs synced ✅"
```

### Change-log entry format — ONE FORMAT ONLY. Every field is mandatory.

```markdown
## YYYY-MM-DD — [Short imperative title: what was done, not what was planned]

- **What:** [Precise description. Name the function, the line, the behaviour changed.]
- **Files:** [Every file touched. Full relative paths. No glob patterns.]
- **Why:** [The reason. Business rule, bug, audit finding, security issue.]
- **Root cause:** [For bug fixes only: what caused the bug. Skip for features.]
- **Impact:** [What this enables, fixes, or prevents. Be specific.]
- **Tests:** [Which test files were added or updated. Which test cases cover this change.]
- **Docs updated:** [Every app_manual file updated. If none needed, write "none required — [reason]".]
```

### CORRECT entry example:

```markdown
## 2026-03-01 — Fix CSRF token mismatch blocking all POST requests after restart

- **What:** Changed csurf cookie httpOnly from true to false. Added /api/log,
  /api/user/register, /api/user/login to CSRF exempt list. Added EBADCSRFTOKEN
  handler to global error handler in app.js.
- **Files:** backend/src/app.js
- **Why:** Frontend cached stale CSRF token. After server restart csurf secret
  changed making old token invalid. httpOnly:true prevented browser from reading
  _csrf cookie for double-submit pattern.
- **Root cause:** Three separate misconfigurations: wrong httpOnly value, no exempt
  list for public routes, no specific error handler for EBADCSRFTOKEN.
- **Impact:** All POST requests now succeed. CSRF protection still active on all
  financial endpoints.
- **Tests:** backend/src/__tests__/routes.test.js — updated 4 tests to use
  getCsrfToken() helper. Added test: CSRF-exempt routes return 200 without token.
- **Docs updated:** app_manual/security-and-compliance.md — CSRF section rewritten.
```

### FORBIDDEN entry styles — writing any of these is a documentation failure:

```
❌ "Updated code"                      — zero information content
❌ "Fixed bug"                         — which bug, which file, what caused it
❌ No entry at all                     — the worst violation, never acceptable
❌ "Will fix later" or "TODO"          — only document completed work
❌ Aspirational/future content         — if it is not in the code, it is not in the log
❌ Old content appended below new      — REPLACE sections, never append
❌ Duplicate date headers              — one entry block per date, merge if needed
❌ Entry without Files field           — every change has a file, name it
❌ Entry without Tests field           — every change either has tests or explains why not
```

---

## 📋 DOCUMENTATION TRIGGER TABLE

Check this table after EVERY change. Every row that matches must be executed.

| You changed...                       | You MUST update...                                                        |
|--------------------------------------|---------------------------------------------------------------------------|
| Any controller function              | change-log.md + api-spec.md (if response/params changed)                  |
| Any route definition                 | change-log.md + api-spec.md                                               |
| Any middleware                       | change-log.md + security-and-compliance.md (if security-related)          |
| Any auth/session logic               | change-log.md + security-and-compliance.md + api-spec.md                  |
| Any DB model field or association    | change-log.md + README.md DB section                                      |
| Any DB migration                     | change-log.md + README.md DB section                                      |
| Any business rule or domain logic    | change-log.md + business-process-flows.md                                 |
| Any security middleware or config    | change-log.md + security-and-compliance.md                                |
| Any environment variable             | change-log.md + README.md DevOps section + .env.example                   |
| Any npm package installed/removed    | change-log.md + README.md Architecture section                            |
| Any frontend component               | change-log.md                                                             |
| Any new test file or test case       | change-log.md Tests field for that day's entry                            |
| Any bug fix                          | change-log.md with Root cause field filled                                |
| Any file deleted                     | change-log.md — what was deleted and why                                  |
| Any config file (jest, vite, etc.)   | change-log.md                                                             |
| Any new API endpoint                 | change-log.md + api-spec.md FULL entry (auth, body, returns, all errors)  |
| Any architecture change              | change-log.md + README.md + architecture-diagram.txt                      |
| Any onboarding/setup change          | change-log.md + guide-for-new-developers.md                               |

**Rule: If you are unsure whether a change needs documentation — it does. Document it.**

---

## 🏗️ CODE QUALITY STANDARDS

### 1. Controller Pattern — The Only Acceptable Shape

Every async controller function in this codebase must follow this exact structure.
No variations. No shortcuts. No exceptions.

```javascript
// THE CORRECT PATTERN
const createChitFund = async (req, res, next) => {
  try {
    // ── 1. Explicit input extraction — NEVER pass req.body directly ──────────
    const { name, monthlyAmount, chitsLeft } = req.body

    // ── 2. Validate every field — type, presence, range ──────────────────────
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Fund name must be at least 3 characters'
      })
    }
    if (!monthlyAmount || typeof monthlyAmount !== 'number' || monthlyAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'monthlyAmount must be a positive number'
      })
    }

    // ── 3. Auth identity from JWT only ───────────────────────────────────────
    const adminId = req.user.id  // NEVER: req.body.userId, req.body.adminId

    // ── 4. Business logic ─────────────────────────────────────────────────────
    const fund = await ChitFund.create({
      name: name.trim(),
      monthlyAmount,
      chitsLeft,
      adminId             // Whitelist — never spread req.body
    })

    // ── 5. Consistent response envelope ──────────────────────────────────────
    return res.status(201).json({ success: true, data: { chitFund: fund } })

  } catch (error) {
    next(error)  // ALWAYS — never res.status(500), never swallow
  }
}

module.exports = { createChitFund }  // Named export — never anonymous
```

```javascript
// FORBIDDEN PATTERNS — any of these means the controller must be rewritten
const wrong1 = async (req, res) => {          // Missing next — unhandled rejections
  await Model.create(req.body)                 // Mass assignment — security breach
  res.json({ message: 'done' })               // Wrong envelope, no error handling
}

const wrong2 = async (req, res, next) => {
  try { ... }
  catch (e) { res.status(500).json({ error: e.message }) }  // Leaks internals
}

const wrong3 = async (req, res, next) => {
  const userId = req.body.userId              // Trust user-supplied identity — NEVER
}
```

### 2. Response Envelope — No Exceptions

```javascript
// Success
res.status(200).json({ success: true, data: payload })
res.status(201).json({ success: true, data: createdResource })

// Error
res.status(400).json({ success: false, error: 'Human readable message', details: [...] })
res.status(401).json({ success: false, error: 'Authentication required' })
res.status(403).json({ success: false, error: 'Insufficient permissions' })
res.status(404).json({ success: false, error: 'Resource not found' })
res.status(409).json({ success: false, error: 'Resource already exists' })
res.status(429).json({ success: false, error: 'Too many requests' })

// NEVER:
res.json({ message: 'ok' })          // No success flag
res.send('Error occurred')           // Plain text
res.status(500).json({ error: e })   // Leaks error detail in production
```

### 3. Input Validation — Explicit Whitelist

```javascript
// CORRECT
const { username, firstName, lastName, mobile, password } = req.body
if (!username || typeof username !== 'string' || username.trim().length < 3) {
  return res.status(400).json({ success: false, error: 'Username must be at least 3 characters' })
}

// WRONG — never
await User.create(req.body)
await User.update(req.body, { where: { id } })
```

### 4. Authentication — On Every Protected Route

```javascript
// CORRECT
router.post('/create', authenticate, requireAdmin, createChitFund)
router.get('/me', authenticate, getMe)

// WRONG — missing authenticate
router.post('/create', createChitFund)
```

### 5. Database Transactions — Required for All Multi-Step Financial Writes

```javascript
// CORRECT — atomic
const result = await sequelize.transaction(async (t) => {
  const bid = await Bid.create({ sessionId, userId, amount }, { transaction: t })
  await ChitSession.update(
    { currentBid: amount, lastBidder: userId },
    { where: { id: sessionId }, transaction: t }
  )
  return bid
})

// WRONG — non-atomic, leaves DB inconsistent on failure
await Bid.create({ sessionId, userId, amount })
await ChitSession.update({ currentBid: amount }, { where: { id: sessionId } })
```

### 6. Global Error Handler — Last Middleware in app.js

```javascript
// MUST be the last middleware in app.js — never move it
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      success: false,
      error: 'Security token expired. Please refresh the page.',
      code: 'CSRF_INVALID'
    })
  }
  console.error(err)
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  })
})
```

---

## 🔒 SECURITY STANDARDS — MANDATORY, NO EXCEPTIONS

### Authentication
- All protected routes use the `authenticate` middleware — verify before writing route code
- Never trust `req.body.userId` — always use `req.user.id` from the JWT middleware
- Never trust `req.body.role` or `req.body.isAdmin` — verify from DB or JWT claim only

### Authorization
- Admin-only routes: `router.post(path, authenticate, requireAdmin, handler)`
- Fund-specific actions: verify the user is a member/admin of THAT specific fund
- Never assume a logged-in user has access to all resources — check ownership every time

### Input Safety
- Never pass `req.body` directly to Sequelize — always whitelist fields explicitly
- Validate every field: type, length, format, range
- Sanitize before storing: trim strings, reject null bytes, reject control characters

### Output Safety
- Never return stack traces in production responses
- Never return passwords, password hashes, or JWT secrets in any response
- Never log passwords, OTPs, or tokens

### Cookies
- Session cookies: `httpOnly: true`, `secure: true` (production), `sameSite: 'strict'`
- CSRF cookie `_csrf`: `httpOnly: false` (browser JS must read it), `sameSite: 'strict'`

### File Uploads
- Validate MIME type AND file extension (not just Content-Type header)
- Always rename uploaded files to UUID — never use the original filename
- Always set `Content-Disposition: attachment` when serving uploaded files

---

## 🚨 KNOWN OPEN ISSUES — READ BEFORE TOUCHING RELATED CODE

| Issue | Location | Status | Required Action |
|---|---|---|---|
| Token blacklist not implemented | userController.js logout | OPEN | JWT valid until expiry after logout — cookie cleared only |
| SameSite=Lax on session cookies | app.js cookie config | OPEN | Change to 'strict' |
| No CI/CD pipeline | — | OPEN | Run all tests manually before every commit |
| No Docker | — | OPEN | Manual environment setup only |
| sync-env.js antipattern | sync-env.js | OPEN | Session timeout must be enforced server-side |
| Flat file logging | logToFile.js | OPEN | Not queryable — replace with Pino eventually |
| change-log.md duplicate old section | change-log.md | OPEN | Clean up on next edit |

---

## 🗂️ FILE LOCATIONS QUICK REFERENCE

```
app_manual/
├── README.md                    ← Project architecture, implementation status
├── change-log.md                ← ALL changes — update after every task
├── api-spec.md                  ← All API endpoints
├── business-process-flows.md    ← Business rules
├── security-and-compliance.md   ← Security measures
└── guide-for-new-developers.md  ← Onboarding

backend/src/
├── app.js                       ← Express setup, middleware, error handler
├── controllers/                 ← All business logic
├── routes/                      ← Route definitions only
├── models/                      ← Sequelize models
├── middleware/                  ← authenticate, requireAdmin, rate limit
└── __tests__/                   ← All backend tests

frontend/src/
├── App.jsx                      ← Main shell, routing
├── components/                  ← All React components
├── utils/                       ← Utility functions
└── __tests__/                   ← All frontend tests including a11y
```

---

# ⚡ ADVANCED TESTING MANDATE
# ZERO TOLERANCE. NO SHORTCUTS. NO PARTIAL COMPLIANCE.
# This section governs ALL test creation and modification.
# It overrides all prior test guidance where there is any conflict.

---

## 🔴 THE ABSOLUTE TESTING LAW

**Before writing or modifying a single test, you MUST:**

```
STEP 1: Open the source file being tested. Read every single line.
STEP 2: Open every file the source imports. Read those too.
STEP 3: List every exported function.
STEP 4: For each function: map every branch, every return, every throw, every DB call.
STEP 5: List every mock required (every import that touches DB, FS, JWT, sockets, email).
STEP 6: Write the pre-test audit (format below).
STEP 7: Only then write a single test case.
```

**Writing tests without reading the source is guessing.**
**Guessed tests pass when code is broken. That is worse than no tests.**

---

## 📋 MANDATORY PRE-TEST AUDIT

Complete this audit in full before writing any test. This is not optional.
If you cannot answer an item, you have not read the source file thoroughly enough.

```
═══════════════════════════════════════════════════════
PRE-TEST AUDIT
═══════════════════════════════════════════════════════
SOURCE FILE:      [full path]
TEST FILE TARGET: [full path]
TEST TYPE:        [unit | integration | e2e]

EXPORTS:
  [list every exported function or class]

FOR EACH EXPORT — complete all fields:

  FUNCTION: [name]
  ─────────────────────────────────────────────────────
  Parameters:
    - [param name]: [type] [required/optional] [valid range] [what happens if missing/wrong]
  
  DB calls made:
    - [Model.method({ where: {...} })] → [what it returns on success / null / throw]
  
  External calls:
    - [jwt.sign / bcrypt.hash / fs.writeFile / io.emit / etc.] → [success / throw]
  
  Response paths (every res.status call):
    - [status code]: [body shape] [when this path is taken]
  
  Error paths:
    - [what triggers next(error)] [what triggers early return]
  
  Business rules enforced:
    - [every if/else that enforces domain logic — cite the rule from business-process-flows.md]
  
  Side effects beyond response:
    - [DB write / cookie set / cookie clear / socket emit / audit log / file write]

MOCKS REQUIRED (unit tests):
  - [import path] → jest.mock('[import path]')

INTEGRATION POINTS (requires real DB/server):
  - [which operations need a real DB connection]

TOTAL TEST CASES REQUIRED:
  - Input validation:    [N]
  - Authentication:      [N]
  - Authorization:       [N]
  - Business logic:      [N]
  - DB interactions:     [N]
  - Response contract:   [N]
  - Side effects:        [N]
  - Security:            [N]
  - Race conditions:     [N]
  - Accessibility:       [N — frontend only]
  TOTAL:                 [N]
═══════════════════════════════════════════════════════
```

---

## 🧪 THE TEN COVERAGE CATEGORIES

Every category applies to every function. No category is optional.
No case within a category is optional.

---

### CATEGORY 1 — INPUT VALIDATION
#### Every parameter, every edge, every attack

For every parameter in every function:

```
PRESENCE:
□ Parameter is undefined
□ Parameter is null
□ Parameter is empty string ""
□ Parameter is whitespace only "   "
□ Parameter is missing from req.body/params/query entirely

TYPE:
□ String where number expected: "123" instead of 123
□ Number where string expected: 123 instead of "username"
□ Array where scalar expected: ["a","b"] instead of "a"
□ Object where primitive expected: {} instead of "value"
□ Boolean where string expected: true instead of "true"
□ NaN passed as number
□ Infinity passed as number
□ Float passed where integer required

BOUNDARIES:
□ Minimum valid value (boundary IN)
□ One below minimum (boundary OUT)
□ Maximum valid value (boundary IN)
□ One above maximum (boundary OUT)
□ Zero for numeric fields
□ Negative values for numeric fields
□ String at exactly max length
□ String at max length + 1 character

INJECTION:
□ SQL injection: ' OR '1'='1'; DROP TABLE users; --
□ XSS: <script>alert(document.cookie)</script>
□ NoSQL injection: { "$gt": "" }
□ Path traversal: ../../etc/passwd
□ Null byte injection: field\x00value
□ Unicode attack: zero-width space, RTL override character
□ CRLF injection: field\r\nX-Injected: header
□ Template injection: {{7*7}} or ${7*7}

FOR req.body:
□ req.body is undefined (body-parser not configured or wrong content-type)
□ req.body is empty: {}
□ req.body has all required fields with valid values
□ req.body has required fields with invalid values (each field separately)
□ req.body has extra fields for privilege escalation: { isAdmin: true, role: 'admin' }
□ req.body field is a nested object when flat value expected
□ req.body with Content-Type: application/json but malformed JSON

FOR req.params:
□ Param missing entirely (route mismatch)
□ Param is empty string
□ Param is "undefined" as a string literal
□ Param is not a valid UUID when UUID expected: "123", "abc", "not-a-uuid"
□ Param is integer 0
□ Param is negative integer: -1
□ Param is valid UUID format but does not exist in DB → 404
□ Param is valid UUID that exists but belongs to a different user → 403

FOR req.query:
□ Query param missing
□ Query param empty string
□ Query param with injection characters
□ Query param as array when scalar expected: ?id[]=1&id[]=2
□ Query param with extremely long value (> 1000 chars)
```

---

### CATEGORY 2 — AUTHENTICATION
#### Every JWT state, every cookie state

For every route that uses the `authenticate` middleware:

```
□ No session cookie present → 401
□ Session cookie present but value is empty string → 401
□ Session cookie present but JWT is not valid JWT format (random string) → 401
□ Session cookie present but JWT signature is invalid (tampered payload) → 401
□ Session cookie present but JWT is expired → 401
□ Session cookie present but JWT payload missing 'id' field → 401
□ Session cookie present but JWT payload missing 'username' field → 401
□ Session cookie present but JWT payload 'id' is not a UUID → 401
□ Session cookie present with valid JWT → proceeds to authorization check
□ x-username header present (only) → 401 (deprecated Feb 2026 — must be ignored)
□ x-username header present AND valid JWT cookie present → JWT cookie used, 200
□ Authorization: Bearer [token] header (instead of cookie) → 401 (not supported)
□ Logged out session: valid JWT in cookie but cookie was cleared by logout → 401
   NOTE: Token blacklist not implemented. If JWT not expired, this currently PASSES.
   Document this gap in the test with a comment:
   // KNOWN GAP: Token blacklist not implemented. This test documents that a
   // valid JWT from a logged-out session will pass authentication until expiry.
   // See known issues table in copilot-instructions.md.
```

---

### CATEGORY 3 — AUTHORIZATION
#### Every role, every fund boundary, every ownership check

For every route that checks roles or ownership:

```
ROLE CHECKS:
□ Unauthenticated user → 401 (auth fails before authz check)
□ Authenticated user with role 'member' attempts admin-only action → 403
□ Authenticated user with role 'admin' of fund A attempts action on fund B → 403
□ Authenticated user with role 'admin' of their own fund → 200/201

FUND MEMBERSHIP CHECKS:
□ User who is not a member of fund X attempts to bid in fund X → 403
□ User who is a pending member (not yet approved) attempts to bid → 403
□ User who has been rejected attempts to rejoin immediately → verify rule
□ Admin attempts to approve their own membership → verify rule

CROSS-RESOURCE ACCESS (IDOR):
□ User A reads User B's profile → 403
□ User A modifies User B's profile → 403
□ Member of fund A reads details of fund B (private fund) → 403
□ Admin of fund A approves a membership request in fund B → 403

OWNERSHIP ESCALATION:
□ Member sends body: { role: 'admin' } → role must remain 'member' in DB
□ Member sends body: { isAdmin: true } → field must be ignored
□ User sends body: { userId: '[other-user-uuid]' } → req.user.id must be used
□ User sends body: { adminId: '[other-user-uuid]' } → ignored

MULTI-ADMIN APPROVAL RULES (chit fund specific):
□ Fund with 2 admins: 1 approval → membership still pending
□ Fund with 2 admins: 2 approvals → membership becomes active
□ Fund with 3 admins: 2 approvals → membership still pending
□ Admin who already approved tries to approve again → verify: error or no-op
□ Admin attempts to approve membership in a fund with 0 other admins → verify rule
```

---

### CATEGORY 4 — BUSINESS LOGIC
#### Every rule from business-process-flows.md — one test per rule

Read business-process-flows.md before writing any test in this category.
Every rule in that file must map to at least one test case.
If a rule has no test, it does not exist as far as CI is concerned.

```
CHIT FUND CREATION:
□ Admin creates fund with valid name, monthlyAmount, chitsLeft → 201 with fund returned
□ Fund name already exists (case-insensitive if applicable) → 409
□ monthlyAmount is 0 → 400
□ monthlyAmount is -1 → 400
□ monthlyAmount is 0.001 (fractional) → verify acceptance or rejection from code
□ chitsLeft is 0 → 400
□ chitsLeft is -1 → 400
□ chitsLeft is 1.5 (non-integer) → 400
□ chitsLeft is greater than any configured maximum → 400 (if limit exists)
□ Fund created: creator automatically becomes admin member → verify in DB

JOINING / MEMBERSHIP:
□ Non-member requests to join existing fund → pending membership created → 200
□ Non-member requests to join non-existent fund → 404
□ Already-pending member requests to join again → 409
□ Already-active member requests to join again → 409
□ Previously-rejected member requests to join again → verify from code (allowed or 409)
□ Admin approves pending member → membership status changes to 'active'
□ Admin rejects pending member → membership removed or status 'rejected'
□ Admin of fund A approves member in fund A: 1 of 1 admin → active immediately
□ Admin of fund A approves member in fund A: 1 of 2 admins → still pending
□ Both admins of fund A approve → membership becomes active
□ Admin approval recorded in approvals array on membership record
□ Admin who already approved cannot approve again (no double-counting)

AUCTION / BIDDING:
□ Member places bid in active session → bid recorded → 200
□ Bid amount is 0 → 400
□ Bid amount is negative → 400
□ Bid amount exceeds totalPoolAmount → 400
□ Bid amount is non-numeric string → 400
□ Bid placed in completed session → 400
□ Bid placed in not-yet-started session → 400
□ Two members bid: higher bid amount wins (= highest discount)
□ winnerGets = poolAmount - bidAmount → verify with exact arithmetic
□ interestPerPerson = bidAmount / (totalMembers - 1) → verify exact arithmetic
□ interestPerPerson is distributed among all non-winning members
□ Session marked 'completed' after winner determined
□ Member who won a previous session in this fund: verify if they can bid again (from code)
□ Admin closes session manually before bidding ends → verify from code

SESSION MANAGEMENT:
□ Admin creates session for their fund → 201
□ Admin creates session for fund they are not admin of → 403
□ Session number already exists for this fund → 409
□ Two sessions for the same fund same month → verify from code
□ Session with past start date → verify from code (accepted or rejected)
```

---

### CATEGORY 5 — DATABASE INTERACTIONS
#### Every Sequelize call, every outcome

For every Sequelize method called in the source file:

```
findOne / findByPk:
□ Returns null → controller returns 404 (or appropriate error)
□ Returns record with all expected fields → controller proceeds normally
□ Returns record with null in a field the controller dereferences → does not crash
□ Returns record with unexpected field values → handled gracefully
□ Throws SequelizeConnectionError → next(error) called, no response sent
□ Throws SequelizeTimeoutError → next(error) called, no response sent

findAll:
□ Returns empty array [] → controller handles gracefully (no crash, returns [] or 404)
□ Returns array with exactly one item
□ Returns array with many items → all returned in response
□ Throws → next(error) called

create:
□ Succeeds → new record returned in response with id and timestamps
□ Throws SequelizeUniqueConstraintError → 409 returned (not 500)
□ Throws SequelizeValidationError → 400 returned (not 500)
□ Throws SequelizeForeignKeyConstraintError → 400 or 404 (not 500)
□ Throws SequelizeConnectionError → next(error) called

update:
□ Succeeds, returns [1] (one row updated) → 200
□ Returns [0] (record disappeared between findOne and update) → 404 or handled
□ Throws unique constraint → 409
□ Throws → next(error) called

destroy:
□ Succeeds, returns 1 → 200
□ Returns 0 (record not found) → 404
□ Throws → next(error) called

transaction:
□ All operations succeed → transaction commits, all changes persisted
□ First operation fails → transaction rolls back, no changes in DB
□ Second operation fails → transaction rolls back, first write also undone
□ Verify: after rollback, record count in affected tables is unchanged

MOCK ARGUMENT VERIFICATION — mandatory for every mock call:
```javascript
// REQUIRED — verify exact arguments, not just that the method was called
expect(ChitFund.findOne).toHaveBeenCalledWith({
  where: { id: CHIT_UUID, adminId: USER_UUID },
  include: [{ model: Membership, as: 'memberships' }]
})

// FORBIDDEN — tells you nothing about correctness
expect(ChitFund.findOne).toHaveBeenCalled()
```

TRANSACTION MOCK PATTERN — how to mock sequelize.transaction in unit tests:
```javascript
// In your test file:
const sequelize = require('../db/sequelize')
jest.mock('../db/sequelize', () => ({
  transaction: jest.fn((callback) => callback({
    // mock transaction object passed to callback
    commit: jest.fn(),
    rollback: jest.fn()
  })),
  query: jest.fn()
}))

// In the test:
it('rolls back transaction when second write fails', async () => {
  ChitFund.create.mockResolvedValueOnce({ id: CHIT_UUID })
  Membership.create.mockRejectedValueOnce(new Error('constraint'))

  await createChitFund(buildReq({ body: validBody }), buildRes(), buildNext())

  // Transaction was attempted
  expect(sequelize.transaction).toHaveBeenCalled()
  // No successful response — error passed to next
  expect(next).toHaveBeenCalledWith(expect.any(Error))
  expect(res.json).not.toHaveBeenCalled()
})
```

---

### CATEGORY 6 — RESPONSE CONTRACT
#### Exact shape for every response path

Every response path must be asserted with `toEqual()` on the complete body.
`toHaveProperty()` alone is forbidden — it ignores all other fields.

```javascript
// FORBIDDEN — too loose
expect(res.body).toHaveProperty('success', true)
expect(res.body.data).toBeDefined()

// REQUIRED — complete shape assertion
expect(res.statusCode).toBe(201)
expect(res.body).toEqual({
  success: true,
  data: {
    chitFund: {
      id: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      ),
      name: expect.any(String),
      monthlyAmount: expect.any(Number),
      chitsLeft: expect.any(Number),
      adminId: USER_UUID,
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    }
  }
})

// UUID validation regex — use this for every ID field in response assertions
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

// For error responses — verify the exact error envelope
expect(res.statusCode).toBe(400)
expect(res.body).toEqual({
  success: false,
  error: expect.any(String)
  // If validation details are returned:
  // details: expect.arrayContaining([expect.any(String)])
})

// What must NEVER appear in any response body:
expect(res.body).not.toHaveProperty('password')
expect(res.body).not.toHaveProperty('passwordHash')
expect(res.body).not.toHaveProperty('salt')
expect(res.body).not.toHaveProperty('jwt')
expect(res.body).not.toHaveProperty('secret')
expect(JSON.stringify(res.body)).not.toMatch(/stack/i)      // no stack traces
expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$/)  // no bcrypt hashes
```

---

### CATEGORY 7 — SIDE EFFECTS
#### Everything the controller does beyond returning a response

Controllers do not only return responses. They write to DB, emit sockets, set cookies,
write logs, and call external services. Every side effect must be tested.

```
DB WRITE VERIFICATION:
□ After successful create: verify ModelName.create was called with exact arguments
□ After successful create: verify new record exists (integration test) or mock was called (unit)
□ After failed create: verify ModelName.create was NOT called if validation failed before it
□ After partial failure in transaction: verify rollback occurred (no orphan records)

COOKIE VERIFICATION:
□ On login success: verify res.cookie was called with name 'session'
□ On login success: verify cookie has httpOnly: true
□ On login success: verify cookie has sameSite: 'strict'
□ On login success: verify cookie has secure: true in production
□ On logout: verify res.clearCookie was called with name 'session'

SOCKET.IO EVENT VERIFICATION:
□ After bid placed: verify io.of('/auction').to('auction:[sessionId]').emit was called
□ Verify event name is exactly correct (not 'Bid' instead of 'bid')
□ Verify payload matches the documented socket event schema
□ How to mock socket.io in unit tests:

  ```javascript
  // In test file:
  const mockEmit = jest.fn()
  const mockTo = jest.fn().mockReturnValue({ emit: mockEmit })
  const mockNS = jest.fn().mockReturnValue({ to: mockTo })
  const mockIo = { of: mockNS }
  
  // Before test:
  app.set('io', mockIo)   // or inject via req.app.get('io')
  
  // Assertion:
  expect(mockNS).toHaveBeenCalledWith('/auction')
  expect(mockTo).toHaveBeenCalledWith(`auction:${SESSION_UUID}`)
  expect(mockEmit).toHaveBeenCalledWith('bid:placed', {
    sessionId: SESSION_UUID,
    amount: 1000,
    bidderId: USER_UUID
  })
  ```

AUDIT LOG VERIFICATION:
□ After critical financial action: verify Log.create was called
□ Verify log entry contains: userId, action, resourceId, timestamp
□ Verify log does NOT contain: password, token, secret

CALL COUNT VERIFICATION:
□ res.json was called exactly once (not zero, not twice)
□ next() was NOT called when res.json was called (never both)
□ next() WAS called with an Error instance when DB throws
□ next() was NOT called with undefined or null

  ```javascript
  // Check res.json called exactly once
  expect(res.json).toHaveBeenCalledTimes(1)
  
  // Check mutual exclusion: response sent XOR next called
  const responseSent = res.json.mock.calls.length > 0
  const nextCalled = next.mock.calls.length > 0
  expect(responseSent).not.toBe(nextCalled)  // exactly one of the two must be true
  ```
```

---

### CATEGORY 8 — SECURITY
#### Every attack vector against this specific application

```
MASS ASSIGNMENT:
□ POST body includes { isAdmin: true } → user.isAdmin remains false in DB
□ POST body includes { role: 'admin' } → user.role remains 'member' in DB
□ POST body includes { id: '[different-uuid]' } → ID from JWT used, not body
□ POST body includes { adminId: '[uuid]' } → adminId from JWT used, not body
□ PUT/PATCH body includes { createdAt: '2020-01-01' } → timestamp not overwritten
□ Verify: after these requests, DB record has correct values (mock or integration)

IDOR (INSECURE DIRECT OBJECT REFERENCE):
□ GET /api/user/[other-user-uuid] → 403 (not 200 with their data)
□ PUT /api/user/[other-user-uuid] → 403
□ POST /api/chits/[other-admin-fund]/sessions → 403
□ GET /api/chits/[private-fund-uuid]/members → 403 if not a member

CSRF:
□ POST to protected route without x-csrf-token header → 403
□ POST to protected route with invalid x-csrf-token → 403
□ POST to protected route with valid x-csrf-token → 200/201
□ POST to CSRF-exempt route (/api/log, /api/user/register, /api/user/login) without token → not blocked

SENSITIVE DATA LEAKAGE:
□ GET /api/user/me does not include password field
□ GET /api/user/me does not include passwordHash field
□ POST /api/user/login response does not include JWT secret
□ Any error response in production mode does not include stack trace
□ Verify: JSON.stringify(res.body) does not match /password|hash|secret|stack/i

RESPONSE HEADER SECURITY:
□ Verify helmet middleware sets X-Content-Type-Options: nosniff
□ Verify X-Frame-Options header is set
□ Verify Content-Security-Policy header is present

TIMING ATTACK DOCUMENTATION:
□ GET /api/user/check-username: response time for existing vs non-existing username
   If response times differ significantly, document in test:
   // TIMING ATTACK RISK: username enumeration possible via response time difference.
   // bcrypt comparison adds delay for existing users. Mitigation: not implemented.
   // See security-and-compliance.md.
```

---

### CATEGORY 9 — RACE CONDITIONS AND CONCURRENCY
#### Financial operations require explicit race condition documentation

For every operation that reads then writes:

```javascript
// PATTERN FOR EVERY FINANCIAL OPERATION:
it('RACE CONDITION DOCUMENTATION: simultaneous bids on same session', async () => {
  // RISK: Two simultaneous bid requests both read currentBid = 0.
  // Both pass the "bid > currentBid" validation.
  // Both write their bid to DB.
  // Result: two bids accepted, two potential winners.
  //
  // CURRENT MITIGATION: sequelize.transaction() used — prevents partial writes.
  // MISSING MITIGATION: SELECT FOR UPDATE (row-level lock) not confirmed.
  //
  // TO VERIFY: Check that sequelize.transaction in the bid controller uses:
  //   { lock: Transaction.LOCK.UPDATE } on the ChitSession.findOne call.
  //   If it does not, this race condition can occur in production.
  //
  // ACTION REQUIRED: Add { lock: t.LOCK.UPDATE } to session read in bid controller.
  //
  // This test is a placeholder. Replace with actual concurrent test once
  // row locking is confirmed or implemented.
  expect(true).toBe(true) // placeholder — remove when real test is written
})

it('RACE CONDITION DOCUMENTATION: duplicate join request', async () => {
  // RISK: User double-clicks Join button. Two POST /api/chits/:id/join requests
  // fire simultaneously. Both read: no existing membership. Both create one.
  // Result: duplicate membership records.
  //
  // CURRENT MITIGATION: Unique constraint on (userId, chitFundId) in Membership.
  // If unique constraint exists, second create throws SequelizeUniqueConstraintError.
  // Controller must catch this and return 409, not 500.
  //
  // VERIFY: Membership model has unique constraint on [userId, chitFundId].
  // VERIFY: Catch block for SequelizeUniqueConstraintError returns 409.
  expect(true).toBe(true) // placeholder — replace with real constraint test
})
```

---

### CATEGORY 10 — ACCESSIBILITY (Frontend Only)
#### Every React component, zero violations tolerated

```javascript
// REQUIRED IMPORTS for every .a11y.test.jsx file:
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

// REQUIRED TEST STRUCTURE for every component:
describe('ComponentName — Accessibility', () => {

  it('has no axe accessibility violations in default state', async () => {
    const { container } = render(<ComponentName />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations in loading state', async () => {
    const { container } = render(<ComponentName isLoading={true} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no axe violations in error state', async () => {
    const { container } = render(<ComponentName error="Something failed" />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('all form inputs have associated visible labels', () => {
    render(<ComponentName />)
    const inputs = screen.getAllByRole('textbox')
    inputs.forEach(input => {
      expect(input).toHaveAccessibleName()
    })
  })

  it('all buttons have accessible names', () => {
    render(<ComponentName />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toHaveAccessibleName()
    })
  })

  it('error messages use role=alert so screen readers announce them', async () => {
    render(<ComponentName />)
    // trigger an error
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('interactive elements are keyboard navigable in logical order', async () => {
    render(<ComponentName />)
    const user = userEvent.setup()
    await user.tab()
    // First focusable element receives focus
    expect(document.activeElement).not.toBe(document.body)
  })

  it('modal traps focus and restores focus on close', async () => {
    // Only if component contains a modal/dialog
    const triggerButton = screen.getByRole('button', { name: /open/i })
    await userEvent.click(triggerButton)
    // Focus is inside the modal
    expect(document.activeElement).toBeInTheDocument() // more specific assertion needed
    await userEvent.keyboard('{Escape}')
    // Focus returns to trigger button
    expect(document.activeElement).toBe(triggerButton)
  })
})
```

---

## 🏗️ TEST FILE STRUCTURE — THE ONLY ACCEPTABLE FORMAT

### Backend Unit Tests

```javascript
'use strict';

// ── Imports ───────────────────────────────────────────────────────────────────
const { functionA, functionB } = require('../controllers/targetController');
const ModelA = require('../models/ModelA');
const ModelB = require('../models/ModelB');
// Do NOT import sequelize here unless mocking transactions

// ── Mocks ─────────────────────────────────────────────────────────────────────
jest.mock('../models/ModelA');
jest.mock('../models/ModelB');
// Mock every external dependency — no real DB calls in unit tests
// Do NOT call sequelize.close() — unit tests never open a connection

// ── Test Data Factory ─────────────────────────────────────────────────────────
// UUID constants — always strings, never integers
const IDs = {
  user:       'aaaaaaaa-0000-4000-8000-000000000001',
  admin:      'bbbbbbbb-0000-4000-8000-000000000002',
  chitFund:   'cccccccc-0000-4000-8000-000000000003',
  membership: 'dddddddd-0000-4000-8000-000000000004',
  session:    'eeeeeeee-0000-4000-8000-000000000005',
  bid:        'ffffffff-0000-4000-8000-000000000006'
}

// Factory functions — build realistic test data, not minimal stubs
function makeChitFund(overrides = {}) {
  return {
    id: IDs.chitFund,
    name: 'Test Chit Fund',
    monthlyAmount: 10000,
    chitsLeft: 12,
    adminId: IDs.admin,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    save: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue(true),
    destroy: jest.fn().mockResolvedValue(1),
    ...overrides
  }
}

function makeMembership(overrides = {}) {
  return {
    id: IDs.membership,
    userId: IDs.user,
    chitFundId: IDs.chitFund,
    role: 'member',
    status: 'pending',
    approvals: [],
    save: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue(true),
    ...overrides
  }
}

function makeUser(overrides = {}) {
  return {
    id: IDs.user,
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    mobile: '9999999999',
    role: 'member',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  }
}

// ── Request / Response / Next Builders ────────────────────────────────────────
// Called INSIDE each test — never reused across tests
function buildReq(overrides = {}) {
  return {
    params: {},
    body: {},
    query: {},
    user: { id: IDs.user, username: 'testuser' },
    cookies: {},
    headers: {},
    app: { get: jest.fn() },  // for req.app.get('io')
    ...overrides
  }
}

function buildRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json:   jest.fn().mockReturnThis(),
    send:   jest.fn().mockReturnThis(),
    end:    jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    set:    jest.fn().mockReturnThis()
  }
}

function buildNext() { return jest.fn() }

// ── Test Suite ────────────────────────────────────────────────────────────────
describe('[ControllerName] — [functionName]', () => {

  beforeEach(() => {
    jest.clearAllMocks()  // Required — clears call counts and return values
  })

  // ── CATEGORY 1: Input Validation ──────────────────────────────────────────
  describe('Input Validation', () => {
    it('returns 400 when [param] is missing', async () => {
      const req  = buildReq({ body: {} })
      const res  = buildRes()
      const next = buildNext()
      await functionA(req, res, next)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: expect.any(String) })
      )
      expect(next).not.toHaveBeenCalled()
    })
    // ... all Category 1 cases
  })

  // ── CATEGORY 2: Authentication ─────────────────────────────────────────────
  describe('Authentication', () => {
    // Note: authenticate middleware is tested separately in middleware tests.
    // Here: test what happens when req.user is missing (middleware didn't run).
    it('returns 401 when req.user is not set (authenticate middleware missing from route)', async () => {
      const req  = buildReq({ user: undefined })
      const res  = buildRes()
      const next = buildNext()
      await functionA(req, res, next)
      // Either 401 or next(error) — verify which pattern the controller uses
      const responded = res.status.mock.calls.length > 0
      const errored   = next.mock.calls.length > 0
      expect(responded || errored).toBe(true)
      if (responded) expect(res.status).toHaveBeenCalledWith(401)
    })
  })

  // ── CATEGORY 3: Authorization ──────────────────────────────────────────────
  describe('Authorization', () => {
    it('returns 403 when user is not admin of the fund', async () => {
      ModelA.findOne.mockResolvedValueOnce(null) // admin check returns no record
      const req  = buildReq({ params: { chitId: IDs.chitFund }, user: { id: IDs.user } })
      const res  = buildRes()
      const next = buildNext()
      await functionA(req, res, next)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: expect.any(String) })
      )
    })
  })

  // ── CATEGORY 4: Business Logic ─────────────────────────────────────────────
  describe('Business Logic', () => {
    // Each test maps to a specific rule in business-process-flows.md
    it('[rule from business-process-flows.md: exact quote or reference]', async () => {
      // ...
    })
  })

  // ── CATEGORY 5: Database Interactions ─────────────────────────────────────
  describe('Database Interactions', () => {
    it('returns 404 when record not found in DB', async () => {
      ModelA.findOne.mockResolvedValue(null)
      const req  = buildReq({ params: { id: IDs.chitFund } })
      const res  = buildRes()
      const next = buildNext()
      await functionA(req, res, next)
      expect(res.status).toHaveBeenCalledWith(404)
      expect(ModelA.findOne).toHaveBeenCalledWith({
        where: { id: IDs.chitFund }
        // exact query — not just { where: expect.any(Object) }
      })
    })

    it('calls next(error) when DB throws — does not send response', async () => {
      const dbError = new Error('Connection reset by peer')
      ModelA.findOne.mockRejectedValue(dbError)
      const req  = buildReq({ params: { id: IDs.chitFund } })
      const res  = buildRes()
      const next = buildNext()
      await functionA(req, res, next)
      expect(next).toHaveBeenCalledWith(dbError)
      expect(res.json).not.toHaveBeenCalled()  // no response sent after error
    })
  })

  // ── CATEGORY 6: Response Contract ─────────────────────────────────────────
  describe('Response Contract', () => {
    it('returns exact response shape on success', async () => {
      ModelA.findOne.mockResolvedValue(makeChitFund())
      const req  = buildReq({ params: { id: IDs.chitFund } })
      const res  = buildRes()
      const next = buildNext()
      await functionA(req, res, next)
      expect(res.statusCode || res.status.mock.calls[0][0]).toBe(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          // exact shape — every field the API contract promises
        }
      })
      // Verify no sensitive fields
      const responseBody = res.json.mock.calls[0][0]
      expect(responseBody).not.toHaveProperty('password')
      expect(responseBody).not.toHaveProperty('passwordHash')
    })
  })

  // ── CATEGORY 7: Side Effects ───────────────────────────────────────────────
  describe('Side Effects', () => {
    it('calls res.json exactly once (no double-response)', async () => {
      ModelA.findOne.mockResolvedValue(makeChitFund())
      const req  = buildReq()
      const res  = buildRes()
      const next = buildNext()
      await functionA(req, res, next)
      expect(res.json).toHaveBeenCalledTimes(1)
      expect(next).not.toHaveBeenCalled()
    })
  })

  // ── CATEGORY 8: Security ──────────────────────────────────────────────────
  describe('Security', () => {
    it('ignores isAdmin field in request body', async () => {
      const req  = buildReq({ body: { name: 'Test', isAdmin: true, role: 'admin' } })
      const res  = buildRes()
      const next = buildNext()
      await functionA(req, res, next)
      // Verify create was not called with isAdmin or role
      if (ModelA.create.mock.calls.length > 0) {
        expect(ModelA.create.mock.calls[0][0]).not.toHaveProperty('isAdmin')
        expect(ModelA.create.mock.calls[0][0]).not.toHaveProperty('role')
      }
    })
  })

}) // end describe

// NO afterAll in unit test files.
// Sequelize is never opened. Nothing to close. Do not add it.
```

---

### Backend Integration Tests (routes.test.js)

```javascript
'use strict';

const request  = require('supertest');
const app      = require('../app');
const sequelize = require('../db/sequelize');

let server;
let agent;       // persists cookies across requests (supertest agent)
let csrfToken;   // fetched fresh before each describe block that needs it
let csrfCookie;  // the _csrf cookie that must accompany the token

// ── SERVER LIFECYCLE ──────────────────────────────────────────────────────────
// ONE beforeAll. ONE afterAll. TOP LEVEL ONLY. Never nested inside describe.

beforeAll(async () => {
  await new Promise((resolve, reject) => {
    server = app.listen(0, (err) => err ? reject(err) : resolve())
  })
  agent = request.agent(server)

  // Fetch CSRF token and cookie
  const tokenRes = await agent.get('/api/csrf-token/token')
  csrfToken  = tokenRes.body.csrfToken
  const csrfCookieStr = (tokenRes.headers['set-cookie'] || [])
    .find(c => c.startsWith('_csrf='))
  csrfCookie = csrfCookieStr?.split(';')[0]
})

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
  await sequelize.close()
  // ONE call to each. If this file has more than one afterAll, that is a bug.
})

// ── DB STATE ISOLATION ────────────────────────────────────────────────────────
// Integration tests run against the real DB.
// Tests must not pollute each other's data.
// Use timestamp-suffixed names to ensure uniqueness per test run.
const RUN_ID = Date.now()
const testUsers = {
  admin:  { username: `admin_${RUN_ID}`,  password: 'AdminPass123!', mobile: `9${RUN_ID.toString().slice(-9)}` },
  member: { username: `member_${RUN_ID}`, password: 'MemberPass123!', mobile: `8${RUN_ID.toString().slice(-9)}` }
}

// ── CSRF HELPER ───────────────────────────────────────────────────────────────
// Attaches CSRF token + cookie to requests that need it.
// Do NOT call on CSRF-exempt routes: /api/log, /api/health, /api/user/register, /api/user/login

function withCsrf(req) {
  if (csrfToken && csrfCookie) {
    return req.set('Cookie', csrfCookie).set('x-csrf-token', csrfToken)
  }
  return req
}

// ── AUTH HELPER ───────────────────────────────────────────────────────────────
// Registers and logs in a user, returns their session cookie.
// CSRF-exempt routes — no withCsrf needed for register/login.

async function registerAndLogin({ username, password, mobile, firstName = 'Test', lastName = 'User' }) {
  await agent.post('/api/user/register').send({
    username, password, confirmPassword: password,
    firstName, lastName, mobile, otp: '123456'
  })
  const loginRes = await agent.post('/api/user/login').send({ username, password })
  const cookies  = loginRes.headers['set-cookie'] || []
  return cookies.find(c => c.startsWith('session='))
}

// ── TESTS ─────────────────────────────────────────────────────────────────────
// ... test suites using withCsrf() and registerAndLogin()
```

---

### Middleware Tests (authenticate.test.js)

```javascript
// The authenticate middleware has 100% coverage requirement.
// Every JWT state must be tested directly on the middleware function.
// Do not rely on controller tests to cover middleware paths.

'use strict';

const authenticate = require('../middleware/authenticate');
const jwt = require('jsonwebtoken');

const VALID_SECRET = process.env.JWT_SECRET || 'test-secret-minimum-32-chars-for-hmac'
const USER_UUID    = 'aaaaaaaa-0000-4000-8000-000000000001'

function buildReq(cookieValue) {
  return {
    cookies: cookieValue !== undefined ? { session: cookieValue } : {}
  }
}

function buildRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json:   jest.fn().mockReturnThis()
  }
}

describe('authenticate middleware', () => {
  const next = jest.fn()

  beforeEach(() => { jest.clearAllMocks() })

  it('calls next() when JWT is valid', () => {
    const token = jwt.sign({ id: USER_UUID, username: 'test' }, VALID_SECRET, { expiresIn: '1h' })
    const req   = buildReq(token)
    const res   = buildRes()
    authenticate(req, res, next)
    expect(next).toHaveBeenCalledWith()
    expect(req.user).toEqual(expect.objectContaining({ id: USER_UUID }))
    expect(res.status).not.toHaveBeenCalled()
  })

  it('returns 401 when no session cookie', () => {
    authenticate(buildReq(undefined), buildRes(), next)
    expect(next).not.toHaveBeenCalled()
    expect(buildRes().status).not.toHaveBeenCalled()
    // ... depends on middleware implementation
  })

  it('returns 401 when JWT is malformed', () => {
    const req = buildReq('not.a.jwt')
    const res = buildRes()
    authenticate(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when JWT signature is invalid', () => {
    const token = jwt.sign({ id: USER_UUID }, 'wrong-secret')
    authenticate(buildReq(token), buildRes(), next)
    expect(buildRes().status).toHaveBeenCalledWith(401)
  })

  it('returns 401 when JWT is expired', () => {
    const token = jwt.sign({ id: USER_UUID }, VALID_SECRET, { expiresIn: '-1s' })
    authenticate(buildReq(token), buildRes(), next)
    expect(buildRes().status).toHaveBeenCalledWith(401)
  })

  it('returns 401 when JWT payload is missing id field', () => {
    const token = jwt.sign({ username: 'test' }, VALID_SECRET)  // no id
    authenticate(buildReq(token), buildRes(), next)
    expect(buildRes().status).toHaveBeenCalledWith(401)
  })

  it('does not use x-username header even if present', () => {
    const req = { cookies: {}, headers: { 'x-username': 'hacker' } }
    const res = buildRes()
    authenticate(req, res, next)
    expect(req.user).toBeUndefined()  // x-username must not set req.user
    expect(res.status).toHaveBeenCalledWith(401)
  })
})
```

---

### Model Tests (ModelName.test.js)

```javascript
// Every Sequelize model must have tests for:
// - Required field constraints (null/empty values)
// - Unique constraints
// - Association correctness
// - Enum validation (if applicable)
// - Custom validators (if any)
// These tests require a real DB connection — they are integration tests.

'use strict';

const sequelize  = require('../db/sequelize');
const ChitFund   = require('../models/ChitFund');
const User       = require('../models/User');

const RUN_ID = Date.now()

beforeAll(async () => {
  await sequelize.authenticate()
})

afterAll(async () => {
  await sequelize.close()
})

describe('ChitFund model', () => {
  it('creates a valid record with all required fields', async () => {
    const fund = await ChitFund.create({
      name: `Fund ${RUN_ID}`,
      monthlyAmount: 10000,
      chitsLeft: 12,
      adminId: '[valid-admin-uuid]'
    })
    expect(fund.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(fund.name).toBe(`Fund ${RUN_ID}`)
    expect(fund.createdAt).toBeInstanceOf(Date)
  })

  it('throws when name is null', async () => {
    await expect(ChitFund.create({ monthlyAmount: 1000, chitsLeft: 12 }))
      .rejects.toThrow()
  })

  it('throws unique constraint error when name already exists', async () => {
    const name = `Unique ${RUN_ID}`
    await ChitFund.create({ name, monthlyAmount: 1000, chitsLeft: 12 })
    await expect(ChitFund.create({ name, monthlyAmount: 2000, chitsLeft: 6 }))
      .rejects.toThrow(/unique/i)
  })

  it('throws when monthlyAmount is zero', async () => {
    await expect(ChitFund.create({ name: `Zero ${RUN_ID}`, monthlyAmount: 0, chitsLeft: 12 }))
      .rejects.toThrow()
  })

  it('throws when monthlyAmount is negative', async () => {
    await expect(ChitFund.create({ name: `Neg ${RUN_ID}`, monthlyAmount: -1, chitsLeft: 12 }))
      .rejects.toThrow()
  })
})
```

---

## ❌ FORBIDDEN TEST PATTERNS — EVERY ONE IS A BAN, NOT A SUGGESTION

These patterns are BANNED. Finding any of them in a test file is a blocker.
The test file must be fixed before it is committed. No exceptions.

```javascript
// ❌ BAN #1: Accepting 500 as a valid response
expect([400, 401, 403, 500]).toContain(res.statusCode)
// 500 = unhandled exception in controller. A test that accepts 500
// passes even when the controller is completely crashed. NEVER accept 500.

// ❌ BAN #2: Asserting only status code, not body
expect(res.statusCode).toBe(200)
// Half the contract. Body can be {} and this test passes. Assert body too.

// ❌ BAN #3: Loose body assertions
expect(res.body).toHaveProperty('success', true)
// toHaveProperty checks one key. Use toEqual() for the complete shape.

// ❌ BAN #4: Empty test cases
it('creates a chit fund', async () => {
  // TODO
})
// Empty tests always pass. They are not tests. Delete the it() block entirely.
// A missing test is honest. A passing empty test is a lie.

// ❌ BAN #5: Integer IDs
req.user = { id: 1 }
// Models use UUIDs. Integer IDs cause type mismatches. Always use UUID strings.

// ❌ BAN #6: sequelize.close() in unit test afterAll
afterAll(async () => { await sequelize.close() })  // in a file with jest.mock('../models/...')
// Sequelize was never opened in a unit test. Calling close() here shuts down
// the connection pool for other test files in the same Jest worker. Cascading failures.

// ❌ BAN #7: Reusing res/next across tests
const res = buildRes()  // declared outside beforeEach — mock call counts accumulate
// By test 3, res.json shows 3 calls. Assertions are meaningless.
// Build inside each test or in beforeEach. Never at describe scope.

// ❌ BAN #8: Mock called without argument verification
expect(Membership.findOne).toHaveBeenCalled()
// Passes even if called with completely wrong arguments. Always:
expect(Membership.findOne).toHaveBeenCalledWith({ where: { id: MEMBER_UUID } })

// ❌ BAN #9: Multiple afterAll in one file
describe('A', () => { afterAll(() => sequelize.close()) })
describe('B', () => { afterAll(() => sequelize.close()) })
// First close succeeds. Second throws. Everything after it corrupts.
// ONE afterAll at the top level. Zero afterAll in unit test files.

// ❌ BAN #10: x-username header in any test
.set('x-username', 'testuser')
// Deprecated and removed February 2026. Tests using it test deleted behaviour.

// ❌ BAN #11: Widening assertions to hide failures
// Before: expect(res.statusCode).toBe(400) — FAILS because controller returns 500
// After:  expect([400, 500]).toContain(res.statusCode) — PASSES but controller is broken
// The assertion was correct. Fix the controller. Never widen to hide a real failure.

// ❌ BAN #12: Testing only the happy path
describe('createChitFund', () => {
  it('creates a fund', async () => { ... })  // one test for a function with 8 branches
})
// Real bugs are in error paths. 1 test for 8 branches = 7 untested bug habitats.

// ❌ BAN #13: Fabricating mock return values without matching real schema
Membership.findOne.mockResolvedValue({ id: 1, status: 'ok' })
// Real Membership has: id (UUID), userId, chitFundId, role, status, approvals, timestamps.
// A mock returning { id: 1, status: 'ok' } will produce false positives or false negatives.
// Use factory functions that return realistic data matching the actual model schema.

// ❌ BAN #14: beforeAll inside nested describe that uses outer lifecycle
describe('outer', () => {
  beforeAll(() => { server = app.listen(0) })
  describe('inner', () => {
    afterAll(() => { server.close() })  // closes server while outer tests still run
  })
  it('runs after inner closed server', async () => { ... })  // server is closed — crash
})
// Lifecycle hooks: top level only. Never nested.

// ❌ BAN #15: Catching assertions to prevent test failure
try {
  expect(res.statusCode).toBe(201)
} catch (e) {
  console.log('test failed but continuing')
}
// If an assertion fails, the test must fail. Never catch assertion errors.
```

---

## 🎯 COVERAGE THRESHOLDS — NON-NEGOTIABLE FLOORS

Below these numbers = tests are failing = do not commit = do not report done.

```javascript
// backend/jest.config.cjs — complete configuration
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  detectOpenHandles: true,
  forceExit: true,
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/controllers/**/*.js',
    'src/models/**/*.js',
    'src/middleware/**/*.js',
    'src/routes/**/*.js',
    'src/utils/**/*.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      lines: 80, functions: 80, branches: 75, statements: 80
    },
    // Financial controllers — money moves through these
    './src/controllers/chitAdminController.js':
      { lines: 95, functions: 95, branches: 90, statements: 95 },
    './src/controllers/chitCrudController.js':
      { lines: 95, functions: 95, branches: 90, statements: 95 },
    './src/controllers/chitJoinController.js':
      { lines: 95, functions: 95, branches: 90, statements: 95 },
    // Auth controller — all user security flows
    './src/controllers/userController.js':
      { lines: 90, functions: 90, branches: 85, statements: 90 },
    // Auth middleware — every protected route runs through this
    './src/middleware/authenticate.js':
      { lines: 100, functions: 100, branches: 95, statements: 100 }
  }
}
```

---

## 🔍 PRE-SUBMISSION CHECKLIST — 40 ITEMS, ALL REQUIRED

All 40 items must be checked. Any unchecked item = do not show the user.

```
PRE-TEST AUDIT:
□ 1.  Did I open and read every line of the source file?
□ 2.  Did I open and read every file the source imports?
□ 3.  Did I map every execution branch?
□ 4.  Can I name every possible status code this file can return?
□ 5.  Can I name every Sequelize call and what happens when it fails?
□ 6.  Did I complete the pre-test audit format before writing test 1?

FILE STRUCTURE:
□ 7.  Exactly ONE beforeAll and ONE afterAll at TOP level (never nested)?
□ 8.  afterAll(sequelize.close()) ABSENT from unit test files?
□ 9.  jest.clearAllMocks() in beforeEach?
□ 10. buildReq() and buildRes() and buildNext() called INSIDE each test?
□ 11. All models mocked with jest.mock()?
□ 12. No integer IDs anywhere — all IDs are UUID format strings?
□ 13. Factory functions used for mock data (not minimal stub objects)?
□ 14. 'use strict' at top of every test file?

CATEGORY COVERAGE:
□ 15. Category 1 — Input validation: missing, null, empty, wrong type, boundaries, injection?
□ 16. Category 2 — Authentication: no cookie, bad JWT, expired, valid, x-username ignored?
□ 17. Category 3 — Authorization: wrong role, wrong fund, IDOR, ownership escalation?
□ 18. Category 4 — Business logic: every rule from business-process-flows.md has a test?
□ 19. Category 5 — DB interactions: null return, constraint errors, DB crash → next(error)?
□ 20. Category 6 — Response contract: exact toEqual() body shape for every response path?
□ 21. Category 7 — Side effects: DB writes, cookie ops, socket events, res.json count?
□ 22. Category 8 — Security: mass assignment, IDOR, CSRF, sensitive data absent from response?
□ 23. Category 9 — Race conditions: documented for all financial read-then-write operations?
□ 24. Category 10 — Accessibility: axe scan + keyboard + labels (frontend files only)?

ASSERTIONS:
□ 25. Every test asserts BOTH status code AND body?
□ 26. Body assertions use toEqual() with complete shape (not just toHaveProperty)?
□ 27. Mock calls verified with exact arguments (not just toHaveBeenCalled())?
□ 28. Zero tests accept 500 as valid status code?
□ 29. Zero tests use x-username header?
□ 30. Sensitive fields (password, passwordHash) explicitly asserted absent from responses?

FORBIDDEN PATTERN SCAN:
□ 31. Zero instances of: [400, 500] in expect list?
□ 32. Zero empty it() blocks (no TODO tests)?
□ 33. Zero multiple afterAll in same file?
□ 34. Zero reused res/next objects across tests?
□ 35. Zero minimal stub mock data — all mocks use factory functions?

EXECUTION:
□ 36. npx jest --verbose [file] — 0 failures confirmed?
□ 37. npx jest --coverage — all thresholds green confirmed?
□ 38. change-log.md updated with test additions documented?
□ 39. If middleware test: authenticate.test.js shows 100% line coverage?
□ 40. Test results reported in the required format below?
```

---

## 📊 TEST RESULTS REPORT FORMAT — MANDATORY, NEVER ABBREVIATED

```
═══════════════════════════════════════════════════════════════
TEST RUN REPORT
═══════════════════════════════════════════════════════════════
File:       backend/src/__tests__/[filename].test.js
Command:    npx jest --coverage --verbose [filename].test.js
Date:       [YYYY-MM-DD HH:MM]

RESULTS
───────────────────────────────────────────────────────────────
Tests:      [X] passing  [Y] failing  [Z] skipped (0 skipped is required)
Suites:     [X] passing  [Y] failing

COVERAGE
───────────────────────────────────────────────────────────────
File                           | Lines      | Functions  | Branches   | Stmts
[target file]                  | XX% [✅/❌] | XX% [✅/❌] | XX% [✅/❌] | XX% [✅/❌]
Global                         | XX% [✅/❌] | XX% [✅/❌] | XX% [✅/❌] | XX% [✅/❌]

Thresholds (target file):  Lines 95% | Functions 95% | Branches 90% | Stmts 95%
Thresholds (global):       Lines 80% | Functions 80% | Branches 75% | Stmts 80%

FAILING TESTS
───────────────────────────────────────────────────────────────
(If count is 0: write "None — all passing")
● [describe block] > [it block]
  Expected:   [exact value]
  Received:   [exact value]
  Source:     [controller file]:[line number]
  Root cause: [what in the controller causes this result]
  Fix:        [exact change needed in SOURCE — not in the test]

UNCOVERED LINES
───────────────────────────────────────────────────────────────
(If none: write "None — full coverage achieved")
[file]:[line or range] — [which branch / condition is not covered]
Test needed: [describe the exact test case that would cover this branch]

FORBIDDEN PATTERN VIOLATIONS
───────────────────────────────────────────────────────────────
(List any banned patterns found in the test file being submitted)
(If none: write "None found")

NEXT ACTION
───────────────────────────────────────────────────────────────
✅ All 40 checklist items confirmed. All passing. All thresholds met.
   change-log.md updated. Task complete.

OR:

❌ [N] failures / [N] threshold violations / [N] checklist items failed.
   Fixing: [describe exactly what will be fixed]
   Will rerun and report before showing user.
═══════════════════════════════════════════════════════════════
```

**INVIOLABLE RULES FOR THIS REPORT:**
- Never say "tests pass" — show the exact numbers
- Never say "coverage looks good" — show the exact percentages
- Never show a report with failures and say "done"
- Never present a test file you have not actually run
- Every failing test's Fix: line points to the SOURCE FILE, never to the test
- A report with ❌ means you fix the problem and rerun before responding to the user

---

*This file is the law for this codebase.*
*No partial compliance. No "I'll improve it later." No "close enough."*
*Every rule exists because something broke without it.*
*Every forbidden pattern was found in this actual codebase across multiple audit rounds.*
*Violating these rules does not save time. It creates debt that compounds.*