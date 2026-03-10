# Backend Code Style & Standards

## Directory Structure
- `controllers/`: All business logic, no direct request/response handling.
- `routes/`: Only route definitions and controller wiring.
- `middleware/`: All Express middleware (auth, error handling, uploads, etc).
- `utils/`: Pure utility functions, helpers, and generators.
- `models/`: Sequelize models only.

## Coding Standards
- Use `const`/`let` (never `var`).
- Use async/await for all asynchronous code.
- Always use try/catch in controllers, propagate errors with `next(err)`.
- No business logic in routes; only controller calls.
- Use centralized error handler middleware for all errors.
- Use ES6+ features (destructuring, arrow functions, etc).
- Use single quotes for strings.
- Always export modules with `module.exports`.
- No inline SQL; use Sequelize ORM only.
- All user input must be validated and sanitized.

## Linting
- Use ESLint with Airbnb base config (or similar strict config).
- Run `npx eslint .` before every commit.
- No unused variables, no console.log in production.

## Documentation
- Every controller and middleware must have a JSDoc comment.
- All routes must be documented in a README or OpenAPI spec.
- All environment/config variables must be documented in config/README.md.

## Security
- Never expose stack traces to clients.
- Always validate authentication and authorization in middleware.
- Never store plaintext passwords (always hash).
- Use helmet and CORS middleware in production.

---

# Example: Controller JSDoc

/**
 * Register a new user
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
async function register(req, res, next) { ... }

