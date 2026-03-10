import React from 'react';
import { render, screen } from '@testing-library/react';
import ChitGrid from '../components/ChitGrid';

describe('ChitGrid', () => {
  it('renders empty state', () => {
    render(<ChitGrid chits={[]} onCardClick={() => {}} />);
    expect(screen.getByText(/no chit funds found/i)).toBeInTheDocument();
  });

  it('renders chit cards', () => {
    const chits = [
      { chitFund: { id: 1, name: 'Test Chit 1', monthlyAmount: 1000, chitsLeft: 5 }, role: 'member' },
      { chitFund: { id: 2, name: 'Test Chit 2', monthlyAmount: 2000, chitsLeft: 3 }, role: 'admin' }
    ];
    render(<ChitGrid chits={chits} onCardClick={() => {}} />);
    expect(screen.getByText('Test Chit 1')).toBeInTheDocument();
    expect(screen.getByText('Test Chit 2')).toBeInTheDocument();
    expect(screen.getByText(/₹1000 per month/i)).toBeInTheDocument();
    expect(screen.getByText(/₹2000 per month/i)).toBeInTheDocument();
    expect(screen.getByText(/chits left: 5/i)).toBeInTheDocument();
    expect(screen.getByText(/chits left: 3/i)).toBeInTheDocument();
    // Check for role labels and their values
    const roleLabels = screen.getAllByText(/role:/i);
    expect(roleLabels.length).toBe(2);
    const roles = Array.from(roleLabels).map(label => label.querySelector('b')?.textContent);
    expect(roles).toContain('member');
    expect(roles).toContain('admin');
  });
});
