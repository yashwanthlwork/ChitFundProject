import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Popup from '../components/Popup';

describe('Popup', () => {
  it('does not render when open is false', () => {
    render(<Popup open={false} message="Test message" onClose={() => {}} />);
    expect(screen.queryByText(/test message/i)).toBeNull();
  });

  it('renders message and calls onClose', () => {
    const onClose = jest.fn();
    render(
      <Popup open={true} message="Popup message" onClose={onClose}>
        <div>Child content</div>
      </Popup>
    );
    expect(screen.getByText(/popup message/i)).toBeInTheDocument();
    expect(screen.getByText(/child content/i)).toBeInTheDocument();
    // Click close button
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
