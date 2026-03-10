// Utility to send logs from frontend to backend log API
export default async function logToBackend(level, message, meta) {
  const stack = (new Error().stack || '').split('\n').slice(2).join('\n');
  let match = document.cookie.match(/(?:^|; )_csrf=([^;]+)/);
  let csrfToken = match ? decodeURIComponent(match[1]) : '';
  let attempt = 0;
  while (attempt < 2) {
    try {
      if (!csrfToken) {
        // Fetch CSRF token and wait for cookie to be set
        await fetch('/api/csrf-token/token', { credentials: 'same-origin' });
        await new Promise(resolve => setTimeout(resolve, 10));
        match = document.cookie.match(/(?:^|; )_csrf=([^;]+)/);
        csrfToken = match ? decodeURIComponent(match[1]) : '';
      }
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        credentials: 'same-origin',
        body: JSON.stringify({ level, message, meta, stack }),
      });
      if (res.ok) return;
      const data = await res.json().catch(() => ({}));
      if (res.status === 403 && data.error && String(data.error).toLowerCase().includes('csrf')) {
        // CSRF error, retry once with fresh token
        csrfToken = '';
        attempt++;
        continue;
      }
      throw new Error(data.error || 'Failed to log');
    } catch (err) {
      if (attempt === 1) {
        // Final fallback: store in localStorage or console
        try {
          const logs = JSON.parse(localStorage.getItem('logToBackend-failures') || '[]');
          logs.push({ level, message, meta, stack, error: err.message, time: new Date().toISOString() });
          localStorage.setItem('logToBackend-failures', JSON.stringify(logs));
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Failed to log to backend and localStorage:', err, message);
        }
        return;
      }
      attempt++;
    }
  }
}
