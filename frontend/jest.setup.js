// Log each test start and end for frontend
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
// Setup file for Jest in frontend
import 'whatwg-fetch';

// Global fetch mock for all tests
beforeAll(() => {
	// In-memory chit funds for test simulation
	let chitFunds = [
		{ id: 1, name: 'Test Chit', monthlyAmount: 1000, chitsLeft: 10, adminName: 'adminuser' }
	];
	// In-memory memberships: { userId, chitFund, role }
	let memberships = [
		{ chitFund: chitFunds[0], role: 'admin' }
	];
	jest.spyOn(global, 'fetch').mockImplementation((url, options) => {
		// Simulate /api/user/me for session check
		if (url === '/api/user/me') {
			// Use localStorage user if set
			let user = { id: 1, username: 'testuser' };
			try {
				user = JSON.parse(window.localStorage.getItem('user')) || user;
			} catch {}
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve(user)
			});
		}
		// Simulate /api/health for health check
		if (url === '/api/health') {
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ ok: true })
			});
		}
		// Simulate GET /api/chits/all-memberships
		if (url === '/api/chits/all-memberships' && (!options || options.method === 'GET')) {
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve([...memberships])
			});
		}
		// Simulate POST /api/chits/create
		if (url === '/api/chits/create' && options && options.method === 'POST') {
			let body = {};
			try { body = JSON.parse(options.body); } catch {}
			const newChit = {
				id: chitFunds.length + 1,
				name: body.name || 'New Chit',
				monthlyAmount: body.monthlyAmount || 0,
				chitsLeft: body.chitsLeft || body.numberOfChits || 0,
				adminName: (options.headers && options.headers['x-username']) || 'adminuser'
			};
			chitFunds.push(newChit);
			memberships.push({ chitFund: newChit, role: 'admin' });
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ success: true, chitFund: newChit })
			});
		}
		// Simulate POST /api/chits/join
		if (url === '/api/chits/join' && options && options.method === 'POST') {
			let body = {};
			try { body = JSON.parse(options.body); } catch {}
			const chit = chitFunds.find(c => c.id === Number(body.code));
			if (!chit) {
				return Promise.resolve({
					ok: false,
					json: () => Promise.resolve({ success: false, error: 'Invalid chit code' })
				});
			}
			// Remove any previous membership for this chit and user role to avoid duplicate keys
			let user = { id: 2, username: 'memberuser' };
			try {
				user = JSON.parse(window.localStorage.getItem('user')) || user;
			} catch {}
			memberships = memberships.filter(m => !(m.chitFund.id === chit.id && m.role === 'member'));
			memberships.push({ chitFund: { ...chit, id: chit.id + 1 }, role: 'member' }); // ensure unique key
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ success: true })
			});
		}
		// Simulate /api/log for logging
		if (url === '/api/log') {
			return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
		}
		// Default: generic ok response
		return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
	});
});
import '@testing-library/jest-dom';
// Always mock env.js for tests
jest.mock('./src/env.js', () => ({ SESSION_TIMEOUT_MINUTES: 30 }));
