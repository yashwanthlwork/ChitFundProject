
import React, { createContext, useContext, useRef, Suspense, useState, useEffect } from 'react';
import Popup from './components/Popup';
const JoinChitFundModal = React.lazy(() => import('./components/JoinChitFundModal'));
import './App.css';
// Code splitting for main forms and grid
const LoginForm = React.lazy(() => import('./components/LoginForm'));
const RegisterForm = React.lazy(() => import('./components/RegisterForm'));
const ChitGrid = React.lazy(() => import('./components/ChitGrid'));
const ChitDetailsPage = React.lazy(() => import('./components/ChitDetailsPage'));
import logToBackend from './utils/logToBackend';

// User/session context for global access and future scalability (e.g., roles, preferences)
export const UserContext = createContext();
export const useUser = () => useContext(UserContext);

// ErrorBoundary for robust error handling (future: log to backend, show fallback UI)
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // TODO: log error to backend or analytics
    // logToBackend('error', error.message, info);
  }
  render() {
    if (this.state.hasError) {
      return <div role="alert" style={{ color: 'red', padding: 24 }}>Something went wrong. Please refresh.<br/>{this.state.error?.toString()}</div>;
    }
    return this.props.children;
  }
}


// Import session timeout from env.js (browser or mock in Jest)
import { SESSION_TIMEOUT_MINUTES } from './env';

function App() {
  // Listen for clear-auth-error event from LoginForm popup
  React.useEffect(() => {
    function clearAuthError() {
      setAuthError('');
    }
    window.addEventListener('clear-auth-error', clearAuthError);
    return () => window.removeEventListener('clear-auth-error', clearAuthError);
  }, []);
  // Core state (minimal, future-proof)
  const [page, setPage] = useState('login');
  const [user, setUser] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [csrfToken, setCsrfToken] = useState('');
  // Fetch CSRF token and return it
  const fetchCsrfToken = async () => {
    try {
      // Fetch new CSRF token and set cookie
      const res = await fetch('/api/csrf-token/token', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to fetch CSRF token');
      await res.json(); // Don't use returned token, use cookie value
      // Wait a tick to ensure cookie is set
      await new Promise(resolve => setTimeout(resolve, 10));
      // Read _csrf cookie value
      const match = document.cookie.match(/(?:^|; )_csrf=([^;]+)/);
      const cookieToken = match ? decodeURIComponent(match[1]) : '';
      setCsrfToken(cookieToken);
      return cookieToken;
    } catch (err) {
      setCsrfToken('');
      return '';
    }
  };
  // On mount, check session and fetch CSRF token
  useEffect(() => {
    fetch('/api/user/me', { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setUser({ id: data.id, username: data.username });
        setPage('home');
      })
      .catch(() => {
        setUser(null);
        setPage('login');
      });
    fetchCsrfToken();
  }, []);

  // Auto-logout on inactivity (frontend timer)
  useEffect(() => {
    if (!user) return;
    const handleActivity = () => setLastActivity(Date.now());
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    const interval = setInterval(() => {
      if (Date.now() - lastActivity > SESSION_TIMEOUT_MINUTES * 60 * 1000) {
        fetch('/api/user/logout', { method: 'POST', credentials: 'same-origin' });
        setUser(null);
        setPage('login');
        setMessage('Session timed out due to inactivity.');
      }
    }, 60000);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      clearInterval(interval);
    };
  }, [user, lastActivity]);
  const [chits, setChits] = useState([]);
  const [message, setMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [createChitForm, setCreateChitForm] = useState({ name: '', monthlyAmount: '', chitsLeft: '' });
  const [createChitLoading, setCreateChitLoading] = useState(false);
  const [selectedChit, setSelectedChit] = useState(null); // chit object
  const [showChitDetails, setShowChitDetails] = useState(false);
  // Ref for accessibility: focus main content on navigation
  const mainRef = useRef(null);

  // Secure, reliable, advanced chit fund fetch (finance-grade)
  useEffect(() => {
    logToBackend('info', 'App mounted');
    const controller = new AbortController();
    async function fetchChits() {
      if (user && page === 'home') {
        try {
          const res = await fetch('/api/chits/all-memberships', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-username': user.username
            },
            signal: controller.signal,
            credentials: 'same-origin',
            cache: 'no-store',
            mode: 'same-origin'
          });
          if (!res.ok) {
            // Log error for audit trail
            logToBackend('error', 'Failed to fetch chit funds', { status: res.status, statusText: res.statusText });
            setChits([]);
            setMessage('Could not load chit funds. Please try again.');
            return;
          }
          const data = await res.json();
          // Validate data structure for finance compliance
          if (!Array.isArray(data.data) || !data.data.every(item => item.chitFund && item.role)) {
            logToBackend('error', 'Invalid chit fund data structure', { data });
            setChits([]);
            setMessage('Data error. Please contact support.');
            return;
          }
          setChits(data.data);
        } catch (err) {
          if (err.name !== 'AbortError') {
            logToBackend('error', 'Chit fund fetch error', { error: err.message });
            setChits([]);
            setMessage('Network error. Please check your connection.');
          }
        } finally {
          // Accessibility: focus main content on navigation
          setTimeout(() => { mainRef.current?.focus && mainRef.current.focus(); }, 100);
        }
      }
    }
    fetchChits();
    return () => {
      controller.abort();
    };
  }, [user, page]);

  // Logout handler
  const handleLogout = () => {
    fetch('/api/user/logout', { method: 'POST', credentials: 'same-origin' });
    setUser(null);
    setPage('login');
    setMessage('Logged out successfully.');
    setChits([]);
  };

  // Main content logic (modular, accessible)
  let content = null;
  if (!user && page === 'login') {
    content = (
      <Suspense fallback={<div>Loading login...</div>}>
        <LoginForm
          onLogin={async ({ username, password }) => {
            setAuthLoading(true);
            setAuthError('');
            try {
              const freshToken = await fetchCsrfToken();
              const res = await fetch('/api/user/login', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-csrf-token': freshToken
                },
                credentials: 'same-origin',
                body: JSON.stringify({ username, password })
              });
              const data = await res.json();
              if (!res.ok) {
                setAuthError(data.error || 'Login failed');
                return;
              }
              // Backend returns: { id, username, guid }
              setUser({ id: data.id, username: data.username });
              setPage('home');
              setMessage('Login successful!');
              await fetchCsrfToken(); // Refresh CSRF token after login
            } catch (err) {
              setAuthError(err.message);
            } finally {
              setAuthLoading(false);
            }
          }}
          loading={authLoading}
          error={authError}
          onShowRegister={() => setPage('register')}
        />
      </Suspense>
    );
  } else if (!user && page === 'register') {
    content = (
      <Suspense fallback={<div>Loading registration...</div>}>
        <RegisterForm
          onRegister={async form => {
            setAuthLoading(true);
            setAuthError('');
            if (form.password !== form.confirmPassword) {
              setAuthError('Passwords do not match');
              setAuthLoading(false);
              return;
            }
            try {
              const freshToken = await fetchCsrfToken();
              const res = await fetch('/api/user/register', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-csrf-token': freshToken
                },
                credentials: 'same-origin',
                body: JSON.stringify(form)
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Registration failed');
              // Treat any 2xx as success (backend returns user object, not { success: true })
              setMessage('Registration successful! Please login.');
              setPage('login');
              await fetchCsrfToken(); // Refresh CSRF token after register
            } catch (err) {
              setAuthError(err.message);
            } finally {
              setAuthLoading(false);
            }
          }}
          loading={authLoading}
          error={authError}
          onShowLogin={() => setPage('login')}
        />
      </Suspense>
    );
  } else if (user && page === 'home') {
    // Show chit details page if selected
    if (showChitDetails && selectedChit) {
      content = (
        <Suspense fallback={<div>Loading chit fund details...</div>}>
          <ChitDetailsPage
            chitId={selectedChit.chitFund ? selectedChit.chitFund.id : selectedChit.id}
            onBack={() => { setShowChitDetails(false); setSelectedChit(null); }}
          />
        </Suspense>
      );
    } else {
      content = (
        <main
          className="main-content"
          tabIndex={-1}
          ref={mainRef}
          aria-label="Chit Fund Dashboard"
          style={{ outline: 'none' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ margin: 0 }}>Your Chit Funds</h2>
            <div>
              <button className="unified-btn" onClick={() => setShowCreate(true)} aria-label="Create new chit fund" style={{ marginRight: 8 }}>
                + Create Chit
              </button>
              <button className="unified-btn" onClick={() => setShowJoin(true)} aria-label="Join chit fund">
                Join Chit Fund
              </button>
            </div>
          </div>
          <Suspense fallback={<div>Loading chit funds...</div>}>
            <ChitGrid chits={chits} onCardClick={chit => { setSelectedChit(chit); setShowChitDetails(true); }} user={user} />
          </Suspense>
          {/* Create chit modal */}
          {showCreate && (
            <Popup open={true} onClose={() => setShowCreate(false)}>
              <div style={{ minWidth: 320, maxWidth: 400 }}>
                <h3 style={{ margin: '0 0 16px 0' }}>Create New Chit Fund</h3>
                <form onSubmit={async e => {
                  e.preventDefault();
                  setCreateChitLoading(true);
                  setMessage('');
                  try {
                    const freshToken = await fetchCsrfToken();
                    const res = await fetch('/api/chits/create', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-csrf-token': freshToken
                      },
                      credentials: 'same-origin',
                      body: JSON.stringify({
                        name: createChitForm.name,
                        monthlyAmount: createChitForm.monthlyAmount,
                        chitsLeft: createChitForm.chitsLeft
                      })
                    });
                    const data = await res.json();
                    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create chit fund');
                    setMessage('Chit fund created successfully!');
                    setShowCreate(false);
                    setCreateChitForm({ name: '', monthlyAmount: '', chitsLeft: '' });
                    // Refresh chit list (secure, robust)
                    try {
                      const res = await fetch('/api/chits/all-memberships', {
                        method: 'GET',
                        headers: {
                          'Content-Type': 'application/json',
                          'x-username': user.username
                        },
                        credentials: 'same-origin',
                        cache: 'no-store',
                        mode: 'same-origin'
                      });
                      if (!res.ok) throw new Error('Failed to refresh chit funds');
                      const data = await res.json();
                      if (!Array.isArray(data.data) || !data.data.every(item => item.chitFund && item.role)) throw new Error('Invalid chit fund data structure');
                      setChits(data.data);
                    } catch (err) {
                      setChits([]);
                      setMessage('Could not refresh chit funds.');
                    }
                  } catch (err) {
                    setMessage(err.message);
                  } finally {
                    setCreateChitLoading(false);
                  }
                }}>
                  <div className="input-group">
                    <input
                      className="unified-input"
                      type="text"
                      placeholder="Chit Fund Name (unique)"
                      value={createChitForm.name}
                      onChange={e => setCreateChitForm(f => ({ ...f, name: e.target.value }))}
                      required
                      aria-label="Chit Fund Name"
                    />
                  </div>
                  <div className="input-group">
                    <input
                      className="unified-input"
                      type="number"
                      placeholder="Number of Chits"
                      value={createChitForm.chitsLeft}
                      onChange={e => setCreateChitForm(f => ({ ...f, chitsLeft: e.target.value }))}
                      min={1}
                      required
                      aria-label="Number of Chits"
                    />
                  </div>
                  <div className="input-group">
                    <input
                      className="unified-input"
                      type="number"
                      placeholder="Monthly Amount"
                      value={createChitForm.monthlyAmount}
                      onChange={e => setCreateChitForm(f => ({ ...f, monthlyAmount: e.target.value }))}
                      min={1}
                      required
                      aria-label="Monthly Amount"
                    />
                  </div>
                  <div style={{ margin: '8px 0', color: '#1976d2', fontWeight: 500 }}>
                    Total Amount: ₹{Number(createChitForm.monthlyAmount || 0) * Number(createChitForm.chitsLeft || 0)}
                  </div>
                  <button className="unified-btn" type="submit" disabled={createChitLoading} aria-label="Create Chit Fund">
                    {createChitLoading ? 'Creating...' : 'Create Chit Fund'}
                  </button>
                  <button className="unified-btn" type="button" style={{ marginLeft: 8 }} onClick={() => setShowCreate(false)} aria-label="Cancel">
                    Cancel
                  </button>
                </form>
              </div>
            </Popup>
          )}
          {/* Join chit fund modal */}
          {showJoin && (
            <Suspense fallback={<div>Loading join chit fund...</div>}>
              <JoinChitFundModal
                open={true}
                onClose={() => setShowJoin(false)}
                user={user}
                fetchCsrfToken={fetchCsrfToken}
                onJoined={async () => {
                  setShowJoin(false);
                  // Refresh chit list after joining
                  try {
                    const res = await fetch('/api/chits/all-memberships', {
                      method: 'GET',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-username': user.username
                      },
                      credentials: 'same-origin',
                      cache: 'no-store',
                      mode: 'same-origin'
                    });
                    if (!res.ok) throw new Error('Failed to refresh chit funds');
                    const data = await res.json();
                    if (!Array.isArray(data) || !data.every(item => item.chitFund && item.role)) throw new Error('Invalid chit fund data structure');
                    setChits(data);
                  } catch (err) {
                    setChits([]);
                    setMessage('Could not refresh chit funds.');
                  }
                }}
              />
            </Suspense>
          )}
        </main>
      );
    }
  }

  // App shell with global popups and controls, wrapped in ErrorBoundary and UserContext
  return (
    <ErrorBoundary>
      <UserContext.Provider value={{ user, setUser }}>
        <div className="App">
          <Popup
            open={!!message || !!authError}
            message={message || authError}
            type={((message && message.toLowerCase().includes('success')) ? 'success' : 'error')}
            onClose={() => {
              setMessage('');
              setAuthError('');
            }}
          />
          <FrontendHealthCheck />
          {user && page === 'home' && (
            <button
              className="unified-btn logout-btn"
              style={{
                position: 'fixed',
                top: 18,
                right: 24,
                zIndex: 1200,
                minWidth: 100,
                padding: '10px 24px',
                fontWeight: 700,
                fontSize: 16,
                background: '#fff',
                color: '#1976d2',
                border: '2px solid #1976d2',
                boxShadow: '0 2px 8px #1976d211',
                borderRadius: 12,
                transition: 'background 0.18s, color 0.18s, border 0.18s',
              }}
              onClick={handleLogout}
              aria-label="Logout"
              tabIndex={0}
            >
              Logout
            </button>
          )}
          {content}
        </div>
      </UserContext.Provider>
    </ErrorBoundary>
  );
}

// Frontend health check: pings backend health endpoint and shows status
function FrontendHealthCheck() {
  const [status, setStatus] = useState('checking');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/health', { signal: controller.signal })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setStatus(data.ok ? 'ok' : 'fail'))
      .catch((err) => {
        if (err.name !== 'AbortError') setStatus('fail');
      });
    return () => {
      controller.abort();
    };
  }, []);
  return (
    <div style={{ position: 'fixed', bottom: 10, right: 10, zIndex: 1000, fontSize: 13, color: status === 'ok' ? '#1b7e2a' : '#c62828', background: '#fff', borderRadius: 8, padding: '4px 12px', boxShadow: '0 2px 8px #0001' }} aria-label="Backend Health Status">
      Backend: {status === 'ok' ? 'Healthy' : status === 'checking' ? 'Checking...' : 'Unreachable'}
    </div>
  );
}
export default App;
