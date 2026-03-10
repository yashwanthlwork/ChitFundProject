// ...existing code...
/* global console */
// --- LOGGING SETUP ---


const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const csurf = require('csurf');

const errorHandler = require('./middleware/errorHandler');
const chitRoutes = require('./routes/chit');
const chitCrudRoutes = require('./routes/chit/crud');
const healthRoute = require('./routes/health');
const logRoute = require('./routes/log');
const userAuthRoutes = require('./routes/user/auth');
const csrfRoute = require('./routes/csrf');

const cookieParser = require('cookie-parser');


const app = express();


// Security: HTTP headers
app.use(helmet());

// Parse cookies for CSRF protection
app.use(cookieParser());

// CORS: Only enable in non-production environments
if (process.env.NODE_ENV !== 'production') {
	app.use(cors());
}

app.use(bodyParser.json());

// Rate limiting: apply to all API routes
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // limit each IP to 100 requests per windowMs
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);




const getCsrfCookieOptions = (req) => {
	// Determine domain for CSRF cookie based on request host
	let domain;
	const host = req.hostname || req.headers.host;
	if (host && (host.startsWith('10.') || host.match(/^\d+\.\d+\.\d+\.\d+$/))) {
		// LAN IP (e.g., 10.x.x.x or any IPv4)
		domain = host.split(':')[0];
	} else if (host && host.startsWith('localhost')) {
		domain = undefined; // For localhost, do NOT set domain (let browser decide)
	} else {
		domain = undefined; // fallback: let browser decide
	}
	return {
		httpOnly: true,
		sameSite: 'strict',
		secure: process.env.NODE_ENV === 'production',
		...(domain ? { domain } : {}),
	};
};



// Patch res.cookie to set domain dynamically for CSRF on all requests
app.use((req, res, next) => {
    const origCookie = res.cookie.bind(res);
    res.cookie = (name, value, options = {}) => {
        if (name === '_csrf') {
            options = { ...options, ...getCsrfCookieOptions(req) };
            console.log(`[CSRF DEBUG] Setting _csrf cookie:`, value, options);
        }
        return origCookie(name, value, options);
    };
    next();
});


// Register CSRF-exempt routes first
app.use('/api/health', healthRoute);
app.use('/api/log', logRoute);
app.use('/api/user', userAuthRoutes); // /register and /login are CSRF-exempt
app.use('/api/csrf-token', csrfRoute);

// Apply CSRF protection to all subsequent routes
const csrfProtection = csurf({
    cookie: {
        key: '_csrf',
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        // domain will be set dynamically below
    }
});
app.use(csrfProtection);

// Enhanced CSRF debug logging for mutating requests
app.use((req, res, next) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        const cookieHeader = req.headers.cookie || '';
        const xCsrfHeader = req.headers['x-csrf-token'] || '';
        console.log(`[CSRF DEBUG] ${req.method} ${req.originalUrl}`);
        console.log(`[CSRF DEBUG] Cookie header:`, cookieHeader);
        console.log(`[CSRF DEBUG] x-csrf-token header:`, xCsrfHeader);
        console.log(`[CSRF DEBUG] Parsed cookies:`, req.cookies);
        console.log(`[CSRF DEBUG] Raw headers:`, req.headers);
    }
    next();
});

// Register chit CRUD routes before main chit routes
app.use('/api/chits/crud', chitCrudRoutes);
app.use('/api/chits', chitRoutes);

// Global error handler (must be last)

// Global error handler — MUST be last middleware in app.js
app.use((err, req, res, next) => {
    // Handle CSRF token errors specifically
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({
            success: false,
            error: 'Security token expired or invalid. Please refresh the page.',
            code: 'CSRF_INVALID'
        });
    }

    // All other errors
    // Log error (avoid leaking stack in production)
    // eslint-disable-next-line no-console
    console.error('[ERROR]', err.message, err.stack);
    const status = err.status ||
        (err.name === 'SequelizeValidationError' || err.name === 'SequelizeDatabaseError' ? 400 :
        err.name === 'UnauthorizedError' || (err.message && err.message.toLowerCase().includes('unauthorized')) ? 401 :
        err.message && err.message.toLowerCase().includes('forbidden') ? 403 :
        err.message && err.message.toLowerCase().includes('not found') ? 404 :
        err.message && err.message.toLowerCase().includes('bad request') ? 400 :
        500);

    // Always return { success: false, error: ... } envelope
    if (res && typeof res.status === 'function' && typeof res.json === 'function') {
        res.status(status).json({
            success: false,
            error: process.env.NODE_ENV === 'production' && status === 500
                ? 'Internal server error'
                : (err.message || 'Internal server error'),
            details: err.details || undefined
        });
    } else if (res && typeof res.writeHead === 'function' && typeof res.end === 'function') {
        // Node.js IncomingMessage fallback (supertest edge case)
        res.writeHead(status || 500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            error: err.message || 'Internal server error',
            details: err.details || undefined
        }));
    } else if (res && typeof res.send === 'function') {
        res.send(JSON.stringify({
            success: false,
            error: err.message || 'Internal server error',
            details: err.details || undefined
        }));
    } else {
        // Fallback for non-Express or test environments
        // eslint-disable-next-line no-console
        console.error('Error handler called with invalid res object:', err);
    }
});

// Export the app instance for testing and server
module.exports = app;
