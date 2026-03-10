import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterForm from '../components/RegisterForm';

describe('RegisterForm file upload', () => {
  it('validates and accepts image file upload', async () => {
    const onRegister = jest.fn();
    render(<RegisterForm onRegister={onRegister} loading={false} error={null} onShowLogin={() => {}} />);
    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText(/first name/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText(/last name/i), { target: { value: 'User' } });
    fireEvent.change(screen.getByPlaceholderText(/mobile/i), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), { target: { value: 'testpass123' } });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), { target: { value: 'testpass123' } });
    fireEvent.change(screen.getByPlaceholderText(/otp/i), { target: { value: '123456' } });
    // Simulate file upload
    const file = new File(['dummy'], 'avatar.png', { type: 'image/png' });
    const input = screen.getByLabelText(/profile picture/i);
    fireEvent.change(input, { target: { files: [file] } });
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    await waitFor(() => expect(onRegister).toHaveBeenCalled());
    // Check that the file is included in the form data
    expect(onRegister.mock.calls[0][0].picture).toBeInstanceOf(File);
    expect(onRegister.mock.calls[0][0].picture.name).toBe('avatar.png');
  });

  it('rejects non-image file upload', async () => {
    const onRegister = jest.fn();
    render(<RegisterForm onRegister={onRegister} loading={false} error={null} onShowLogin={() => {}} />);
    const input = screen.getByLabelText(/profile picture/i);
    const file = new File(['dummy'], 'malware.exe', { type: 'application/x-msdownload' });
    fireEvent.change(input, { target: { files: [file] } });
    // Should show a validation error
    await waitFor(() => expect(screen.getByText(/only image files are allowed/i)).toBeInTheDocument());
  });
});
