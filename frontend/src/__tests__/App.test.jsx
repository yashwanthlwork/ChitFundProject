import React from 'react';
import { render, screen, act, cleanup } from '@testing-library/react';
import App from '../App';

afterEach(cleanup);

describe('App', () => {
  beforeAll(() => {
    global.fetch = jest.fn((url) => {
      if (url === '/api/user/me') {
        return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({ error: 'Not authenticated' }) });
      }
      // Default mock for other endpoints
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });
  afterAll(() => {
    global.fetch.mockRestore && global.fetch.mockRestore();
  });
  it('renders without crashing and shows Loading login', async () => {
    await act(async () => {
      render(<App />);
    });
    // Wait for the lazy-loaded LoginForm heading to appear
    expect(await screen.findByRole('heading', { name: /login/i })).toBeInTheDocument();
    // Optionally, also check for the fallback
    expect(screen.queryByText(/loading login/i)).not.toBeInTheDocument();
  });
});
