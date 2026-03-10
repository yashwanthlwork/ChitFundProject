
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import logToBackend from './utils/logToBackend';

// Patch console.error and console.warn to also log to backend
['error', 'warn'].forEach(level => {
  const orig = console[level];
  console[level] = function (...args) {
    orig.apply(console, args);
    try {
      // Only log stringifiable errors
      const msg = args.map(a => (typeof a === 'string' ? a : (a && a.message) ? a.message : JSON.stringify(a))).join(' ');
      logToBackend(level, msg);
    } catch {}
  };
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
