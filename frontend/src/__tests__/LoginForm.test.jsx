import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '../components/LoginForm';

describe('LoginForm', () => {
  it('renders login form and validates input', async () => {
    const onLogin = jest.fn();
    render(<LoginForm onLogin={onLogin} loading={false} error={null} onShowRegister={() => {}} />);
    // Check heading
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    // Try submitting empty form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    // The error is now shown in the Popup, which is rendered in the DOM
    // Wait for the popup message to appear
    // Wait for the popup to appear and check its message
    // Check debug element for clientError
    const debugError = await waitFor(() => screen.getByTestId('debug-client-error'));
    expect(debugError).toBeTruthy();
    expect(debugError.textContent).toMatch(/username must be at least 3/i);
    // Fill valid form
    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'testpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(onLogin).toHaveBeenCalledWith({ username: 'testuser', password: 'testpass123' });
  });

  it('closes error popup when close button is clicked', async () => {
    // Use a wrapper to control error prop
    function Wrapper() {
      const [error, setError] = React.useState('User not found');
      React.useEffect(() => {
        function clear() { setError(''); }
        window.addEventListener('clear-auth-error', clear);
        return () => window.removeEventListener('clear-auth-error', clear);
      }, []);
      return (
        <LoginForm
          onLogin={() => {}}
          loading={false}
          error={error}
          onShowRegister={() => {}}
        />
      );
    }
    render(<Wrapper />);
    // Popup should be visible
    expect(screen.getByText(/user not found/i)).toBeInTheDocument();
    // Click the close (×) button
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    // Popup should disappear (simulate parent clearing error)
    await waitFor(() => {
      expect(screen.queryByText(/user not found/i)).not.toBeInTheDocument();
    });
  });
});
