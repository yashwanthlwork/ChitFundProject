import React from 'react';
import { useState, useRef } from 'react';
import Popup from './Popup';

// LoginForm: secure, accessible, and extensible
export default function LoginForm({ onLogin, loading, error, onShowRegister }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [clientError, setClientError] = useState('');
  const usernameRef = useRef();

  // Client-side validation for future extensibility
  function validate() {
    if (!form.username || form.username.length < 3) return 'Username must be at least 3 characters.';
    if (!form.password || form.password.length < 6) return 'Password must be at least 6 characters.';
    return '';
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    console.log('handleSubmit called, validation error:', err);
    if (err) {
      setClientError(err);
      // Focus first invalid field
      if (!form.username || form.username.length < 3) usernameRef.current?.focus();
      return;
    }
    setClientError('');
    onLogin(form);
  }

  return (
    <div className="auth-form-container" aria-label="Login form">
      <h2 tabIndex={0}>Login</h2>
      {process.env.NODE_ENV === 'test' && (
        <div data-testid="debug-client-error" style={{ display: 'none' }}>{clientError}</div>
      )}
      <form onSubmit={handleSubmit} autoComplete="on" aria-describedby="login-desc">
        <div id="login-desc" style={{ display: 'none' }}>Enter your username and password to log in.</div>
        <div className="input-group">
          <input
            className="unified-input"
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            // required and minLength removed for testability
            aria-label="Username"
            ref={usernameRef}
            autoFocus
          />
        </div>
        <div className="input-group">
          <input
            className="unified-input"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            // required and minLength removed for testability
            aria-label="Password"
            autoComplete="current-password"
          />
        </div>
        <button className="unified-btn" type="submit" disabled={loading} aria-label="Login">
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <button
          className="unified-btn"
          type="button"
          style={{ marginLeft: 8 }}
          onClick={onShowRegister}
          aria-label="Go to registration"
        >
          Register
        </button>
      </form>
      <Popup
        data-testid="login-error-popup"
        open={!!error || !!clientError}
        message={clientError || error}
        type="error"
        onClose={() => {
          setClientError('');
          if (typeof error === 'string' && error) {
            // Try to clear parent error if possible
            if (typeof window !== 'undefined' && window.dispatchEvent) {
              window.dispatchEvent(new CustomEvent('clear-auth-error'));
            }
          }
        }}
      />
    </div>
  );
}
