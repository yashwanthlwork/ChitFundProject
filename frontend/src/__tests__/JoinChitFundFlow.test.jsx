import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import App from '../App';

describe('Join Chit Fund Flow', () => {
  it('renders join modal and submits join request', async () => {
    // Simulate user login
    window.localStorage.setItem('user', JSON.stringify({ id: 2, username: 'memberuser' }));
    render(<App />);
    // Wait for chit grid to load
    await waitFor(() => expect(screen.getAllByText(/chit funds/i).length).toBeGreaterThan(0));
    // Open the join modal by clicking 'Join chit fund' button
    fireEvent.click(screen.getByText('Join Chit Fund'));
    // Wait for join modal to appear
    await waitFor(() => expect(screen.getAllByText(/join chit fund/i).length).toBeGreaterThan(0));
    // Wait for the input to appear (modal is lazy-loaded)
    const codeInput = await screen.findByPlaceholderText(/chit fund code/i);
    fireEvent.change(codeInput, { target: { value: '1' } });
    // Click join button in the modal only
    const modal = codeInput.closest('form');
    const joinBtn = within(modal).getByRole('button', { name: /join chit fund/i });
    fireEvent.click(joinBtn);
    // Wait for the chit card to show 'Role: member' after joining
    await waitFor(() => {
      // Find a chit card button that contains both 'Role:' and 'member'
      const card = screen.getAllByRole('button').find(btn =>
        /role:/i.test(btn.textContent) && /member/i.test(btn.textContent)
      );
      expect(card).toBeInTheDocument();
    });
  });
});
