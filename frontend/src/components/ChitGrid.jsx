// ChitGrid.jsx
// Displays a grid of chit fund cards

import React, { useState } from 'react';
import ChitCard from './ChitCard';
import Popup from './Popup';

function ChitGrid({ chits, onCardClick, user }) {
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionChit, setSessionChit] = useState(null);
  const [sessionForm, setSessionForm] = useState({ date: '', bidAmount: '', finalQuote: '', winnerName: '', winnerGets: '', interestPool: '', beneficiaries: '', interestPerPerson: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!chits || chits.length === 0) {
    return <div style={{ color: '#888', marginTop: 32 }}>No chit funds found.</div>;
  }

  function handleAddSessionClick(chit) {
    setSessionChit(chit);
    setShowSessionModal(true);
    setSessionForm({ date: '', bidAmount: '', finalQuote: '', winnerName: '', winnerGets: '', interestPool: '', beneficiaries: '', interestPerPerson: '' });
    setMessage('');
  }

  async function handleSessionSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/chits/${sessionChit.chitFund.id}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-username': user.username },
        body: JSON.stringify({ ...sessionForm, beneficiaries: sessionForm.beneficiaries.split(',').map(s => s.trim()) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add session');
      setMessage('Session added successfully!');
      setShowSessionModal(false);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        className="chit-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}
      >
        {chits.map(({ chitFund, role }) => (
          <div key={chitFund.id} style={{ position: 'relative' }}>
            <ChitCard
              chitFund={chitFund}
              role={role}
              onClick={() => onCardClick({ ...chitFund, role })}
            />
            {user && chitFund.adminName === user.username && (
              <button
                className="unified-btn"
                style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, fontSize: 12, padding: '4px 10px', minWidth: 0 }}
                onClick={e => { e.stopPropagation(); handleAddSessionClick({ chitFund, role }); }}
                aria-label="Add session details"
              >
                + Add Session
              </button>
            )}
          </div>
        ))}
      </div>
      {showSessionModal && (
        <Popup open={true} onClose={() => setShowSessionModal(false)}>
          <div style={{ minWidth: 320, maxWidth: 400 }}>
            <h3>Add Session for {sessionChit?.chitFund?.name}</h3>
            <form onSubmit={handleSessionSubmit}>
              <div className="input-group">
                <input className="unified-input" type="date" placeholder="Date" value={sessionForm.date} onChange={e => setSessionForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div className="input-group">
                <input className="unified-input" type="number" placeholder="Bid Amount" value={sessionForm.bidAmount} onChange={e => setSessionForm(f => ({ ...f, bidAmount: e.target.value }))} required />
              </div>
              <div className="input-group">
                <input className="unified-input" type="number" placeholder="Final Quote" value={sessionForm.finalQuote} onChange={e => setSessionForm(f => ({ ...f, finalQuote: e.target.value }))} required />
              </div>
              <div className="input-group">
                <input className="unified-input" type="text" placeholder="Winner Name" value={sessionForm.winnerName} onChange={e => setSessionForm(f => ({ ...f, winnerName: e.target.value }))} required />
              </div>
              <div className="input-group">
                <input className="unified-input" type="number" placeholder="Winner Gets" value={sessionForm.winnerGets} onChange={e => setSessionForm(f => ({ ...f, winnerGets: e.target.value }))} required />
              </div>
              <div className="input-group">
                <input className="unified-input" type="number" placeholder="Interest Pool" value={sessionForm.interestPool} onChange={e => setSessionForm(f => ({ ...f, interestPool: e.target.value }))} required />
              </div>
              <div className="input-group">
                <input className="unified-input" type="text" placeholder="Beneficiaries (comma separated)" value={sessionForm.beneficiaries} onChange={e => setSessionForm(f => ({ ...f, beneficiaries: e.target.value }))} required />
              </div>
              <div className="input-group">
                <input className="unified-input" type="number" placeholder="Interest Per Person" value={sessionForm.interestPerPerson} onChange={e => setSessionForm(f => ({ ...f, interestPerPerson: e.target.value }))} required />
              </div>
              <button className="unified-btn" type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Session'}</button>
              <button className="unified-btn" type="button" style={{ marginLeft: 8 }} onClick={() => setShowSessionModal(false)}>Cancel</button>
            </form>
            {message && <div style={{ color: message.includes('success') ? '#1b7e2a' : '#c62828', marginTop: 8 }}>{message}</div>}
          </div>
        </Popup>
      )}
    </>
  );
}

export default ChitGrid;
