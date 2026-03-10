import logToBackend from '../utils/logToBackend';

// Mock fetch for all tests
beforeAll(() => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
});
afterAll(() => {
  global.fetch.mockRestore && global.fetch.mockRestore();
});

describe('logToBackend', () => {
  it('calls fetch with correct params and CSRF header', async () => {
    // Set a fake CSRF cookie for the test
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '_csrf=test-csrf-token'
    });
    await logToBackend('info', 'Test message', { foo: 'bar' });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/log',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-csrf-token': 'test-csrf-token'
        }),
        body: expect.stringContaining('"level":"info"')
      })
    );
    // Also check that stack is present in the body
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body).toEqual(expect.objectContaining({
      level: 'info',
      message: 'Test message',
      meta: { foo: 'bar' },
      stack: expect.any(String)
    }));
  });

  it('handles fetch error gracefully', async () => {
    global.fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));
    // Should not throw
    await expect(logToBackend('error', 'Fail message')).resolves.toBeUndefined();
  });
});
