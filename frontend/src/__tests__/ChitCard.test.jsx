import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChitCard from '../components/ChitCard';

describe('ChitCard', () => {
  const chitFund = { id: 1, name: 'Test Chit', monthlyAmount: 1000, chitsLeft: 5 };
  it('renders chit card details', () => {
    render(<ChitCard chitFund={chitFund} role="member" onClick={() => {}} />);
    expect(screen.getByText('Test Chit')).toBeInTheDocument();
    expect(screen.getByText(/₹1000 per month/i)).toBeInTheDocument();
    expect(screen.getByText(/chits left: 5/i)).toBeInTheDocument();
    expect(screen.getByText(/role:/i)).toBeInTheDocument();
    expect(screen.getByText(/member/i)).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<ChitCard chitFund={chitFund} role="admin" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { hidden: true }) || screen.getByText('Test Chit'));
    // fallback: click the card div if not a button
    expect(onClick).toHaveBeenCalled();
  });
});
