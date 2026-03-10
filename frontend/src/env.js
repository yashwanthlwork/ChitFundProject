// src/env.js
// Export session timeout from Vite env (browser build only)
export const SESSION_TIMEOUT_MINUTES = parseInt(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES, 10) || 30;
