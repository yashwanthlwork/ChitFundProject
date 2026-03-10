# Backend Test Suite: Persistent 403/404 Status Code Assertion Failures

## Issue Summary

Despite removing all references to 403 and 404 from test assertions, test descriptions, and comments in `backend/src/__tests__/routes.test.js`, Jest continues to report failures with messages such as:

- `Expected value: 403`
- `Expected value: 404`

This occurs even after:
- Clearing Jest cache (`npx jest --clearCache`)
- Recreating the test file from scratch (to eliminate hidden characters or encoding issues)
- Restarting the test runner and VS Code

## Affected Files
- `backend/src/__tests__/routes.test.js` (main test file, all status code assertions checked)
- `backend/src/app.js` (Express app, route registration, error handler)
- `backend/src/controllers/` (all controllers, especially those handling chit fund and user routes)
- `backend/src/routes/` (route definitions)
- `backend/src/middleware/` (auth, validation, CSRF)

## Steps Already Taken
1. **Removed all 403/404 from test assertions and descriptions**
   - All `expect(...).toContain(...)` and test descriptions now only reference `[200, 201, 400, 401, 422, 500]`.
   - Verified by full file scan and manual review.
2. **Cleared Jest cache**
   - Ran `npx jest --clearCache` before each test run.
3. **Recreated test file**
   - Created a new file, copied only visible code, deleted the old file, and renamed the new one.
4. **Restarted VS Code and test runner**
   - Ensured no stale processes or file watchers.
5. **Checked for hidden characters/unicode**
   - Used a new file and manual review to ensure no invisible characters.
6. **Confirmed backend is returning 403/404**
   - Test output shows backend is returning 403/404, but test only allows 200, 201, 400, 401, 422, 500.

## Example Failure Output
```
  ● Backend Routes › Chit CRUD Routes › POST /api/chits/crud/create returns 400/401 for missing fields or unauthorized
    expect(received).toContain(expected) // indexOf
    Expected value: 403
    Received array: [400, 401, 422, 500]
```

## Hypothesis
- The backend is returning 403/404 for some requests, but the test only allows 200, 201, 400, 401, 422, 500.
- There may be a business logic or middleware issue causing 403/404 to be returned unexpectedly.

## Next Steps (for further investigation)
- Review backend controller and middleware logic for all routes that may return 403/404.
- Confirm if 403/404 is expected for these routes per business rules.
- If so, update test assertions to allow 403/404. If not, fix backend to only return allowed status codes.

## References
- Test file: [`backend/src/__tests__/routes.test.js`](../../backend/src/__tests__/routes.test.js)
- App entry: [`backend/src/app.js`](../../backend/src/app.js)
- Example controller: [`backend/src/controllers/chitCrudController.js`](../../backend/src/controllers/chitCrudController.js)
- Example route: [`backend/src/routes/chit.js`](../../backend/src/routes/chit.js)
- Middleware: [`backend/src/middleware/`](../../backend/src/middleware/)

---

**All steps above have been performed as of 2026-03-01.**

> Please consult another agent or backend expert for further diagnosis. All standard test and cache issues have been ruled out.
