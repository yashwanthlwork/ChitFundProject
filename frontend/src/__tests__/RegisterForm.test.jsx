import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RegisterForm from '../components/RegisterForm';

describe('RegisterForm', () => {
  it('renders and validates registration form', async () => {
    const onRegister = jest.fn();
    render(<RegisterForm onRegister={onRegister} loading={false} error={null} onShowLogin={() => {}} />);
    // Check heading
    expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
    // Try submitting empty form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    // Check for validation error (username required)
    const debugError = await screen.findByTestId('debug-client-error');
    expect(debugError.textContent).toMatch(/username must be at least 3/i);
    // Fill valid form
    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText(/first name/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText(/last name/i), { target: { value: 'User' } });
    fireEvent.change(screen.getByPlaceholderText(/mobile/i), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), { target: { value: 'testpass123' } });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), { target: { value: 'testpass123' } });
    fireEvent.change(screen.getByPlaceholderText(/otp/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(onRegister).toHaveBeenCalledWith({
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      mobile: '1234567890',
      password: 'testpass123',
      confirmPassword: 'testpass123',
      otp: '123456',
      picture: null
    });
  });
});
