// Mock fetch for chit details
beforeAll(() => {
  global.fetch = jest.fn((url) => {
    if (url.includes('/api/chits/1/details')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          chitFund: {
            id: 1,
            name: 'Test Chit',
            adminUsername: 'testuser',
            adminName: 'testuser',
            monthlyAmount: 1000,
            chitsLeft: 10
          },
          sessions: [],
          members: [],
          stats: {
            totalInterest: 0,
            avgBid: 0,
            highestQuote: 0,
            lowestQuote: 0
          },
        })
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
});
afterAll(() => {
  global.fetch.mockRestore && global.fetch.mockRestore();
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChitDetailsPage from '../components/ChitDetailsPage';
import { UserContext } from '../App';

describe('ChitDetailsPage', () => {
  const mockChitId = 1;
  const mockOnBack = jest.fn();
  const mockUser = { id: 1, username: 'testuser' };

  it('renders chit details and handles back button', async () => {
    render(
      <UserContext.Provider value={{ user: mockUser }}>
        <ChitDetailsPage chitId={mockChitId} onBack={mockOnBack} />
      </UserContext.Provider>
    );
    // Wait for chit details to load (simulate API fetch)
    // Wait for debug info to appear (ensures fetch and render complete)
    expect(await screen.findByText(/debug:/i)).toBeInTheDocument();
    // Click back button
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(mockOnBack).toHaveBeenCalled();
  });
});
