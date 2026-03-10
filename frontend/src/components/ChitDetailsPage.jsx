

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useUser } from '../App';
import BarChart from './BarChart';
import './BarChart.css';

// Optionally, you can use a simple icon set for visual cues
const icons = {
  amount: '💰',
  value: '🪙',
  sessions: '📅',
  start: '⏰',
  status: '🔔',
  admin: '👤',
  interest: '📈',
  bid: '🏷️',
  quote: '💵',
  winner: '🏆',
  pool: '💸',
  beneficiaries: '👥',
  person: '🧑',
  member: '👤',
};



export default function ChitDetailsPage({ chitId, onBack }) {
    const [copied, setCopied] = useState(false);
    const [showInput, setShowInput] = useState(false);
  const userCtx = useUser();
  if (!userCtx || typeof userCtx.user === 'undefined') {
    return <div style={{ color: 'red', padding: 24 }}>Something went wrong. Please refresh or log in again.<br/>User context not available.</div>;
  }
  const { user } = userCtx;
  // All hooks must be called unconditionally and in the same order, before any early return
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveSession, setLiveSession] = useState(null);
  const socketRef = useRef(null);
  const [bidInput, setBidInput] = useState('');
  const [auctionError, setAuctionError] = useState('');
  const [auctionLoading, setAuctionLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef();
  const pollingRef = useRef();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch(`/api/chits/${chitId}/details`, {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...(user?.username ? { 'x-username': user.username } : {})
      }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => { if (isMounted) { setDetails(data); setError(''); } })
      .catch(async err => {
        let msg = 'Could not load chit fund details.';
        if (err.json) { try { const d = await err.json(); msg = d.error || msg; } catch {} }
        if (isMounted) setError(msg);
      })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [chitId, user]);

  // Guard: don't access details fields until loaded
  // Always define currentSession, even if details/sessions not loaded
  let currentSession = null;
  let chitFund, sessions, stats, members;
  if (details) {
    ({ chitFund, sessions, stats, members } = details);
    if (sessions) currentSession = sessions.find(s => !s.isCompleted);
  }

  // WebSocket: subscribe to live session updates
  useEffect(() => {
    if (!currentSession) {
      setLiveSession(null);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }
    // Connect to Socket.io server
    const socket = io('/', { transports: ['websocket'] });
    socketRef.current = socket;
    socket.emit('joinAuction', { sessionId: currentSession.id });
    socket.on('auctionUpdate', (data) => {
      setLiveSession(data);
    });
    // Optionally handle disconnects/errors
    socket.on('disconnect', () => {});
    return () => {
      socket.emit('leaveAuction', { sessionId: currentSession.id });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentSession && currentSession.id]);

  // Timer logic: start 3s after each new bid
  useEffect(() => {
    if (!liveSession || !liveSession.lastBidTime) return;
    const lastBid = new Date(liveSession.lastBidTime).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - lastBid) / 1000);
    const left = Math.max(0, 3 - elapsed);
    setTimer(left);
    if (left > 0) {
      timerRef.current = setInterval(() => {
        setTimer(t => {
          if (t <= 1) { clearInterval(timerRef.current); return 0; }
          return t - 1;
        });
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(timerRef.current);
  }, [liveSession && liveSession.lastBidTime]);

  // Auto-close session if timer hits 0 and there is a lastBidder
  useEffect(() => {
    if (!liveSession || timer > 0) return;
    if (liveSession.lastBidder && !liveSession.isCompleted) {
      fetch(`/api/chits/session/${liveSession.id}/close`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    }
  }, [timer, liveSession]);

  // Place bid handler
  async function handlePlaceBid(e) {
    e.preventDefault();
    setAuctionLoading(true);
    setAuctionError('');
    try {
      const res = await fetch(`/api/chits/session/${liveSession.id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-username': user.username },
        body: JSON.stringify({ amount: Number(bidInput) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bid failed');
      setBidInput('');
    } catch (err) {
      setAuctionError(err.message);
    } finally {
      setAuctionLoading(false);
    }
  }


  // Admin session editing state
  // Prefer chitFund.adminUsername (true username) if available, fallback to adminName for legacy
  const isAdmin = user && chitFund && (
    (chitFund.adminUsername && user.username === chitFund.adminUsername) ||
    (!chitFund.adminUsername && user.username === chitFund.adminName)
  );
  const [editSessions, setEditSessions] = useState([]); // local editable sessions
  const [addingSession, setAddingSession] = useState(false);

  // Prepare analytics data
  const sessionBidData = (editSessions.length ? editSessions : (sessions || [])).map(s => ({ label: `#${s.sessionNumber}`, value: s.bidAmount }));
  const sessionInterestData = (editSessions.length ? editSessions : (sessions || [])).map(s => ({ label: `#${s.sessionNumber}`, value: s.interestPool }));
  // Member win counts
  const memberWins = {};
  (editSessions.length ? editSessions : (sessions || [])).forEach(s => {
    if (s.winnerName) memberWins[s.winnerName] = (memberWins[s.winnerName] || 0) + 1;
  });
  const memberWinData = Object.entries(memberWins).map(([label, value]) => ({ label, value }));

  // Find previous session (last completed)
  const prevSession = (editSessions.length ? editSessions : (sessions || [])).slice().reverse().find(s => s.isCompleted) || null;

  // Early returns after all hooks
  if (loading) return <div className="chit-details-loading">Loading chit fund details...</div>;
  if (error) return <div className="chit-details-error">{error}</div>;
  if (!details) return null;

  // Add session handler (admin only)
  function handleAddSession() {
    setEditSessions(prev => [
      ...(prev.length ? prev : (sessions || [])),
      {
        sessionNumber: (sessions?.length || 0) + (prev.length ? 1 : 1),
        date: '',
        bidAmount: '',
        finalQuote: '',
        winnerName: '',
        winnerGets: '',
        interestPool: '',
        beneficiaries: [],
        interestPerPerson: [],
        isCompleted: false,
        isNew: true
      }
    ]);
    setAddingSession(true);
  }


  // Delete session handler (admin only)
  function handleDeleteSession(idx) {
    setEditSessions(prev => prev.filter((_, i) => i !== idx));
  }

  // Save new session(s) to backend
  async function handleSaveSessions() {
    if (!editSessions.length) return;
    const newSessions = editSessions.filter(s => s.isNew);
    if (!newSessions.length) return;
    try {
      for (const s of newSessions) {
        const res = await fetch(`/api/chits/${chitFund.id}/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-username': user.username },
          body: JSON.stringify({
            sessionNumber: s.sessionNumber,
            date: s.date,
            bidAmount: s.bidAmount,
            finalQuote: s.finalQuote,
            winnerName: s.winnerName,
            winnerGets: s.winnerGets,
            interestPool: s.interestPool,
            beneficiaries: Array.isArray(s.beneficiaries) ? s.beneficiaries : (s.beneficiaries || '').split(',').map(x => x.trim()),
            interestPerPerson: Array.isArray(s.interestPerPerson) ? s.interestPerPerson : []
          })
        });
        // Check if response is JSON before parsing
        const contentType = res.headers.get('content-type');
        if (!res.ok) {
          if (contentType && contentType.includes('application/json')) {
            const errData = await res.json();
            throw new Error(errData.error || 'Failed to save session');
          } else {
            const text = await res.text();
            throw new Error('Failed to save session: ' + (text.startsWith('<!DOCTYPE') ? 'Server error or misrouted request.' : text));
          }
        }
      }
      // After saving, reload details
      window.location.reload();
    } catch (err) {
      alert('Failed to save session(s): ' + (err.message || err));
    }
  }

  // Edit session field handler
  function handleEditSessionField(idx, field, value) {
    setEditSessions(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  // Render
  return (
    <div className="chit-details-page enhanced" style={{ minHeight: '100vh', width: '100vw', background: 'none', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div className="chit-details-card" style={{
        width: '100%',
        maxWidth: 980,
        margin: '40px auto',
        padding: '36px 40px 32px 40px',
        border: 'none',
        borderRadius: 22,
        background: 'linear-gradient(135deg, #e3f0ff 0%, #f7fbff 100%)',
        boxShadow: '0 8px 32px #1976d222',
        color: '#1a237e',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        minHeight: '80vh',
        overflow: 'visible',
        position: 'relative'
      }}>
        {/* DEBUG: Show chitFund and user info for troubleshooting admin button visibility */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
          <div style={{ background: '#fffbe7', color: '#c62828', fontSize: 13, borderRadius: 8, padding: '6px 12px', marginRight: 16, marginBottom: 6 }}>
            <b>DEBUG:</b> user.username = <b>{user?.username || 'N/A'}</b>, chitFund.adminUsername = <b>{chitFund?.adminUsername || 'N/A'}</b>, chitFund.adminName = <b>{chitFund?.adminName || 'N/A'}</b>
          </div>
          <button className="unified-btn chit-details-back" style={{ minWidth: 90, margin: 0 }} onClick={onBack}>&larr; Back</button>
        </div>
        <h2 className="chit-details-title" style={{ margin: '0 0 18px 0', fontSize: '2.1rem', fontWeight: 800, color: '#1976d2', textAlign: 'left', wordBreak: 'break-word' }}>{chitFund.name}</h2>
        {/* Admin: Add Session button */}
        {isAdmin && (
          <button className="unified-btn" style={{ marginBottom: 12 }} onClick={handleAddSession}>
            + Add Session
          </button>
        )}

        {/* Live auction panel for current session */}
        {liveSession && !liveSession.isCompleted && (
          <div className="live-auction-panel">
            <div className="live-auction-title">Live Auction: Session #{liveSession.sessionNumber}</div>
            <div className="live-auction-row">
              <div><b>Current Bid:</b> ₹{liveSession.currentBid || liveSession.startBid || 0}</div>
              <div><b>Participants:</b> {Array.isArray(liveSession.participants) ? liveSession.participants.join(', ') : ''}</div>
              <div><b>Last Bidder:</b> {liveSession.lastBidder || '-'}</div>
              <div><b>Time left:</b> {timer > 0 ? `${timer}s` : 'Closed'}</div>
            </div>
            <form className="live-auction-form" onSubmit={handlePlaceBid}>
              <input
                type="number"
                className="unified-input"
                placeholder="Enter your bid"
                value={bidInput}
                min={((liveSession.currentBid || liveSession.startBid || 0) + 1)}
                onChange={e => setBidInput(e.target.value)}
                required
                disabled={auctionLoading || timer === 0}
              />
              <button className="unified-btn" type="submit" disabled={auctionLoading || timer === 0 || !bidInput}>
                {auctionLoading ? 'Placing...' : 'Place Bid'}
              </button>
            </form>
            {auctionError && <div className="chit-details-error">{auctionError}</div>}
            <div className="live-auction-bids">
              <b>Bid History:</b>
              <ul>
                {Array.isArray(liveSession.bids) && liveSession.bids.length > 0 ? (
                  liveSession.bids.map((b, i) => (
                    <li key={i}>{b.user}: ₹{b.amount} <span style={{ color: '#888', fontSize: 12 }}>({b.time})</span></li>
                  ))
                ) : <li>No bids yet.</li>}
              </ul>
            </div>
          </div>
        )}

        {/* Previous session highlight */}
        {prevSession && (
          <div className="prev-session-highlight">
            <div className="prev-session-title">Previous Session #{prevSession.sessionNumber}</div>
            <div className="prev-session-flex">
              <div className="prev-session-info">
                <div><span className="chit-details-icon">{icons.start}</span> <b>Date:</b> {prevSession.date}</div>
                <div><span className="chit-details-icon">{icons.bid}</span> <b>Bid Amount:</b> ₹{prevSession.bidAmount}</div>
                <div><span className="chit-details-icon">{icons.quote}</span> <b>Final Quote:</b> ₹{prevSession.finalQuote}</div>
                <div><span className="chit-details-icon">{icons.pool}</span> <b>Interest Pool:</b> ₹{prevSession.interestPool}</div>
                <div><span className="chit-details-icon">{icons.beneficiaries}</span> <b>Beneficiaries:</b> {prevSession.beneficiaries.join(', ')}</div>
              </div>
              <div className="prev-session-winner">
                <div className="winner-badge">{icons.winner} Winner</div>
                <div className="winner-name">{prevSession.winnerName}</div>
                <div className="winner-gets">Gets: <b>₹{prevSession.winnerGets}</b></div>
                <div className="interest-per-person">Interest/Person: <b>₹{prevSession.interestPerPerson}</b></div>
              </div>
            </div>
          </div>
        )}

        <div className="chit-details-flex-row" style={{ flexWrap: 'wrap', gap: 32, marginBottom: 24, display: 'flex' }}>
          <div className="chit-details-overview enhanced">
            <div><span className="chit-details-icon">{icons.amount}</span> <b>Monthly Amount:</b> ₹{chitFund.monthlyAmount}</div>
            <div><span className="chit-details-icon">{icons.value}</span> <b>Total Value:</b> ₹{chitFund.monthlyAmount * chitFund.chitsLeft}</div>
            <div><span className="chit-details-icon">{icons.sessions}</span> <b>Chits/Sessions:</b> {chitFund.chitsLeft}</div>
            <div><span className="chit-details-icon">{icons.start}</span> <b>Start Date:</b> {chitFund.startDate}</div>
            <div><span className="chit-details-icon">{icons.status}</span> <b>Status:</b> {chitFund.status || (sessions.length === chitFund.chitsLeft ? 'Active' : 'Completed')}</div>
            <div><span className="chit-details-icon">{icons.admin}</span> <b>Admin:</b> {chitFund.adminName || '-'}</div>
            {/* Admin-only: Show invitation code */}
            {isAdmin && (
              <div style={{ marginTop: 8 }}>
                <span className="chit-details-icon">🔗</span> <b>Invitation Code:</b>
                {showInput ? (
                  <input
                    id="invite-code-input"
                    value={chitFund.id}
                    readOnly
                    style={{ fontFamily: 'monospace', background: '#f5f5f5', padding: '2px 8px', borderRadius: 4, width: 260, marginLeft: 8 }}
                    onFocus={e => e.target.select()}
                    autoFocus
                  />
                ) : (
                  <span
                    id="invite-code"
                    style={{ fontFamily: 'monospace', background: '#f5f5f5', padding: '2px 8px', borderRadius: 4 }}
                  >{chitFund.id}</span>
                )}
                <button
                  style={{ marginLeft: 8, fontSize: 13, padding: '2px 8px', borderRadius: 4, border: '1px solid #1976d2', background: '#e3f2fd', color: '#1976d2', cursor: 'pointer' }}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(chitFund.id);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1200);
                    } catch (e) {
                      setShowInput(true);
                      setCopied(false);
                      setTimeout(() => {
                        const input = document.getElementById('invite-code-input');
                        if (input) input.select();
                      }, 100);
                    }
                  }}
                  title="Copy code to clipboard"
                >Copy</button>
                {copied && <span style={{ color: '#388e3c', fontSize: 13, marginLeft: 8 }}>Copied!</span>}
                {showInput && <span style={{ color: '#1976d2', fontSize: 13, marginLeft: 8 }}>Press Ctrl+C/Cmd+C to copy</span>}
                <span style={{ color: '#888', fontSize: 12, marginLeft: 6 }}>(Share this code for others to join)</span>
              </div>
            )}
          </div>
          <div className="chit-details-stats enhanced">
            <div><span className="chit-details-icon">{icons.interest}</span> <b>Total Interest Distributed:</b> ₹{stats.totalInterest}</div>
            <div><span className="chit-details-icon">{icons.bid}</span> <b>Average Bid:</b> ₹{stats.avgBid}</div>
            <div><span className="chit-details-icon">{icons.quote}</span> <b>Highest Quote:</b> ₹{stats.highestQuote}</div>
            <div><span className="chit-details-icon">{icons.quote}</span> <b>Lowest Quote:</b> ₹{stats.lowestQuote}</div>
            <div><span className="chit-details-icon">{icons.winner}</span> <b>Most Wins:</b> {stats.mostWinsUser} ({stats.mostWinsCount})</div>
          </div>
        </div>

        {/* Analytical/statistical charts */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, margin: '18px 0 0 0', width: '100%' }}>
          <div style={{ flex: '1 1 260px', minWidth: 220 }}>
            <BarChart data={sessionBidData} title="Session Bids" color="#1976d2" height={140} />
          </div>
          <div style={{ flex: '1 1 260px', minWidth: 220 }}>
            <BarChart data={sessionInterestData} title="Interest Pool by Session" color="#43a047" height={140} />
          </div>
          <div style={{ flex: '1 1 260px', minWidth: 220 }}>
            <BarChart data={memberWinData} title="Wins by Member" color="#fbc02d" height={140} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 0, gap: 16 }}>
          <h3 style={{ margin: 0 }}>Session History</h3>
          {isAdmin && editSessions.some(s => s.isNew) && (
            <button className="unified-btn" style={{ background: '#1976d2', color: '#fff', minWidth: 100, fontWeight: 600 }} onClick={handleSaveSessions}>
              Save
            </button>
          )}
        </div>
        <div className="chit-details-table-container" style={{ width: '100%', overflowX: 'auto' }}>
          <table className="chit-details-table enhanced" style={{ width: '100%', minWidth: 900, tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th>{icons.sessions} Session</th>
                <th>{icons.start} Date</th>
                <th>{icons.bid} Bid Amount</th>
                <th>{icons.quote} Final Quote</th>
                <th>{icons.winner} Winner</th>
                <th>{icons.pool} Winner Gets</th>
                <th>{icons.pool} Interest Pool</th>
                <th>{icons.beneficiaries} Beneficiaries</th>
                {isAdmin && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {(editSessions.length ? editSessions : (sessions || [])).map((s, i) => (
                <tr key={i} className={s.isCompleted ? 'completed' : 'pending'}>
                  <td>{s.isNew && isAdmin ? <input value={s.sessionNumber} onChange={e => handleEditSessionField(i, 'sessionNumber', e.target.value)} style={{ width: 40 }} /> : s.sessionNumber}</td>
                  <td>{s.isNew && isAdmin ? <input type="date" value={s.date} onChange={e => handleEditSessionField(i, 'date', e.target.value)} style={{ width: 140 }} /> : s.date}</td>
                  <td>{s.isNew && isAdmin ? <input value={s.bidAmount} onChange={e => handleEditSessionField(i, 'bidAmount', e.target.value)} style={{ width: 70 }} /> : `₹${s.bidAmount}`}</td>
                  <td>{s.isNew && isAdmin ? <input value={s.finalQuote} onChange={e => handleEditSessionField(i, 'finalQuote', e.target.value)} style={{ width: 70 }} /> : `₹${s.finalQuote}`}</td>
                  <td>{s.isNew && isAdmin ? (
                    <select value={s.winnerName} onChange={e => handleEditSessionField(i, 'winnerName', e.target.value)} style={{ width: 110 }}>
                      <option value="">Select Winner</option>
                      {Array.isArray(members) && members.map(m => (
                        <option key={m.username} value={m.username}>{m.name || m.username}</option>
                      ))}
                    </select>
                  ) : s.winnerName}</td>
                  <td>{s.isNew && isAdmin ? <input value={s.winnerGets} onChange={e => handleEditSessionField(i, 'winnerGets', e.target.value)} style={{ width: 70 }} /> : `₹${s.winnerGets}`}</td>
                  <td>{s.isNew && isAdmin ? <input value={s.interestPool} onChange={e => handleEditSessionField(i, 'interestPool', e.target.value)} style={{ width: 70 }} /> : `₹${s.interestPool}`}</td>
                  <td>{s.isNew && isAdmin ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                      <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4 }}>Beneficiaries & Interest/Person:</label>
                      {Array.isArray(s.beneficiaries) && s.beneficiaries.length > 0 ? (
                        s.beneficiaries.map((b, bIdx) => (
                          <div key={bIdx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <select
                              value={b}
                              onChange={e => {
                                const updated = [...s.beneficiaries];
                                updated[bIdx] = e.target.value;
                                handleEditSessionField(i, 'beneficiaries', updated);
                              }}
                              style={{ width: 130 }}
                            >
                              <option value="">Select Beneficiary</option>
                              {Array.isArray(members) && members.map(m => (
                                <option key={m.username} value={m.username}>{m.name || m.username}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              placeholder="Interest/Person"
                              value={Array.isArray(s.interestPerPerson) ? s.interestPerPerson[bIdx] || '' : ''}
                              onChange={e => {
                                let updated = Array.isArray(s.interestPerPerson) ? [...s.interestPerPerson] : [];
                                updated[bIdx] = e.target.value;
                                handleEditSessionField(i, 'interestPerPerson', updated);
                              }}
                              style={{ width: 100 }}
                            />
                            <button type="button" className="unified-btn" style={{ background: '#c62828', minWidth: 0, padding: '4px 10px' }} onClick={() => {
                              const updatedBeneficiaries = s.beneficiaries.filter((_, idx) => idx !== bIdx);
                              const updatedInterest = Array.isArray(s.interestPerPerson) ? s.interestPerPerson.filter((_, idx) => idx !== bIdx) : [];
                              handleEditSessionField(i, 'beneficiaries', updatedBeneficiaries);
                              handleEditSessionField(i, 'interestPerPerson', updatedInterest);
                            }}>Remove</button>
                          </div>
                        ))
                      ) : null}
                      <button type="button" className="unified-btn" style={{ background: '#1976d2', minWidth: 0, padding: '4px 10px', marginTop: 4 }} onClick={() => {
                        const updatedBeneficiaries = Array.isArray(s.beneficiaries) ? [...s.beneficiaries, ''] : [''];
                        const updatedInterest = Array.isArray(s.interestPerPerson) ? [...s.interestPerPerson, ''] : [''];
                        handleEditSessionField(i, 'beneficiaries', updatedBeneficiaries);
                        handleEditSessionField(i, 'interestPerPerson', updatedInterest);
                      }}>Add Beneficiary</button>
                    </div>
                  ) : (Array.isArray(s.beneficiaries) ? s.beneficiaries.join(', ') : s.beneficiaries)}</td>
                  {/* Removed redundant interestPerPerson input; handled per-beneficiary above */}
                  {isAdmin && <td>{s.isNew ? <button className="unified-btn" style={{ background: '#c62828', color: '#fff', minWidth: 0, padding: '4px 10px' }} onClick={() => handleDeleteSession(i)}>Delete</button> : null}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>Members</h3>
        <ul className="chit-details-members enhanced">
          {members.map(m => <li key={m.id}><span className="chit-details-icon">{icons.member}</span> {m.name} <span className="chit-details-role">({m.role})</span></li>)}
        </ul>
      </div>
    </div>
  );
}
