import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Chit Fund Creation Flow', () => {
  let chitFunds;
  beforeEach(() => {
    chitFunds = [];
    global.fetch = jest.fn((url, options = {}) => {
      // User info fetch
      if (url.includes('/api/user/me')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, data: { user: { id: 1, username: 'adminuser', role: 'admin' } } })
        });
      }
      // Chit fund all-memberships fetch (GET)
      if (url.includes('/api/chits/all-memberships')) {
        // Return array of { chitFund, role } as expected by App.jsx/ChitGrid
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, data: chitFunds.map(cf => ({ chitFund: cf, role: 'admin' })) })
        });
      }
      // Debug: log all fetch calls
      // eslint-disable-next-line no-console
      console.log('[MOCK FETCH]', url, options);
      // Chit fund list fetch (GET)
      if (url.includes('/api/chits/list') && (!options.method || options.method === 'GET')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, data: { chitFunds } })
        });
      }
      // Chit fund creation (POST)
      if (url.includes('/api/chits/create') && options.method === 'POST') {
        const newChit = { id: '1', name: 'Test Chit', monthlyAmount: 1000, chitsLeft: 10, adminId: 1 };
        chitFunds.push(newChit);
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ success: true, data: { chitFund: newChit } })
        });
      }
      // Default: healthy backend
      if (url.includes('/api/health')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ healthy: true }) });
      }
      // Default: CSRF token
      if (url.includes('/api/csrf-token/token')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ csrfToken: 'test-csrf-token' }) });
      }
      // Fallback
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders chit creation modal and submits valid form', async () => {
    // Render the app and simulate login as admin
    window.localStorage.setItem('user', JSON.stringify({ id: 1, username: 'adminuser' }));
    render(<App />);
    // Wait for home/dashboard to load
    await waitFor(() => expect(screen.getAllByText(/chit funds/i).length).toBeGreaterThan(0));
    // Open chit creation modal (simulate button click)
    fireEvent.click(screen.getByText('+ Create Chit'));
    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText(/chit fund name/i), { target: { value: 'Test Chit' } });
    fireEvent.change(screen.getByPlaceholderText(/monthly amount/i), { target: { value: '1000' } });
    fireEvent.change(screen.getByPlaceholderText(/number of chits/i), { target: { value: '10' } });
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /create chit fund/i }));
    // Wait for the new chit card to appear in the grid (button with accessible name)
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: /test chit/i });
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });
    // Fallback: also check for the chit fund name text
    await waitFor(() => {
      expect(screen.getByText(/test chit/i)).toBeInTheDocument();
    });
  });
});
