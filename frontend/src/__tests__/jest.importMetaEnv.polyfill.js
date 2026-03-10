// Polyfill for import.meta.env for Jest
if (!globalThis.importMetaEnvPatched) {
  globalThis.importMetaEnvPatched = true;
  globalThis.import = { meta: { env: { VITE_SESSION_TIMEOUT_MINUTES: '30' } } };
}

test('import.meta.env polyfill loads', () => {
  expect(globalThis.import.meta.env.VITE_SESSION_TIMEOUT_MINUTES).toBe('30');
});
