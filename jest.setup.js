// Polyfill setImmediate for Express compatibility in Jest
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
}
// Polyfill for fetch in Jest (browser APIs)
// --- Robust cleanup and mocks for frontend tests ---
const { cleanup } = require('@testing-library/react');

// Unmount React trees after each test to prevent leaks
afterEach(() => {
  cleanup();
  // Optionally clear all timers if you use setTimeout/setInterval
  jest.clearAllTimers();
});

// Polyfill fetch for React Testing Library
if (!global.fetch) {
  global.fetch = () => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
} else {
  global.fetch = require('whatwg-fetch');
}

// Polyfill TextEncoder for jsdom
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

// Mock XMLHttpRequest to silence jsdom errors
global.XMLHttpRequest = function () {
  return {
    open: () => {},
    send: () => {},
    setRequestHeader: () => {},
    readyState: 4,
    status: 200,
    responseText: '',
    onreadystatechange: null,
  };
}
 
// Polyfill for TextEncoder/TextDecoder in Jest (Node < 18 or Jest env)
if (typeof global.TextDecoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
// Polyfill for TextEncoder/TextDecoder in Jest (Node < 18 or Jest env)
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
