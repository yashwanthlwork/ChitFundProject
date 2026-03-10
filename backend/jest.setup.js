// Log each test start and end for backend
beforeEach(() => {
	if (expect.getState().currentTestName) {
		console.log('[TEST][START]', expect.getState().currentTestName);
	}
});
afterEach(() => {
	if (expect.getState().currentTestName) {
		console.log('[TEST][END]', expect.getState().currentTestName);
	}
});
// backend/jest.setup.js — runs before every test file
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long';
process.env.SESSION_TIMEOUT_MINUTES = '60';
process.env.FRONTEND_URL = 'http://localhost:5173';
