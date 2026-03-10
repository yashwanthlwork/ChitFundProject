import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
// Import the health check component directly
import App from '../App';

// Mock fetch for health endpoint
beforeAll(() => {
  global.fetch = jest.fn((url) => {
    if (url === '/api/health') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
});
afterAll(() => {
  global.fetch.mockRestore && global.fetch.mockRestore();
});

describe('FrontendHealthCheck', () => {
  it('shows healthy status when backend is up', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByLabelText(/backend health status/i)).toBeInTheDocument());
    expect(await screen.findByText(/backend: healthy/i)).toBeInTheDocument();
  });

  it('shows unreachable status when backend is down', async () => {
    global.fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));
    render(<App />);
    await waitFor(() => expect(screen.getByLabelText(/backend health status/i)).toBeInTheDocument());
    expect(screen.getByText(/backend: unreachable/i)).toBeInTheDocument();
  });
});
