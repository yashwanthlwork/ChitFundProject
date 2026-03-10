import React, { useState } from 'react';
import Popup from './Popup';

// Simple join chit fund modal
export default function JoinChitFundModal({ open, onClose, user, onJoined, fetchCsrfToken }) {
  const [chitCode, setChitCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleJoin = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Always use fetchCsrfToken from App.jsx for CSRF token
      let freshToken = '';
      if (fetchCsrfToken) {
        freshToken = await fetchCsrfToken();
      }
      const res = await fetch('/api/chits/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': freshToken,
          'x-username': user.username
        },
        credentials: 'same-origin',
        body: JSON.stringify({ code: chitCode })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to join chit fund');
      setSuccess('Successfully joined chit fund!');
      setChitCode('');
      onJoined && onJoined();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popup open={open} onClose={onClose}>
      <div style={{ minWidth: 320, maxWidth: 400 }}>
        <h3 style={{ margin: '0 0 16px 0' }}>Join Chit Fund</h3>
        <form onSubmit={handleJoin}>
          <div className="input-group">
            <input
              className="unified-input"
              type="text"
              placeholder="Chit Fund Code"
              value={chitCode}
              onChange={e => setChitCode(e.target.value)}
              required
              aria-label="Chit Fund Code"
            />
          </div>
          <button className="unified-btn" type="submit" disabled={loading} aria-label="Join Chit Fund">
            {loading ? 'Joining...' : 'Join Chit Fund'}
          </button>
          <button className="unified-btn" type="button" style={{ marginLeft: 8 }} onClick={onClose} aria-label="Cancel">
            Cancel
          </button>
        </form>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        {success && <div style={{ color: 'green', marginTop: 8 }}>{success}</div>}
      </div>
    </Popup>
  );
}
