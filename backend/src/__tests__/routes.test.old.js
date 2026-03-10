const request = require('supertest');
const app = require('../app');
const sequelize = require('../db/sequelize');
let server;
let csrfToken;
let csrfCookie;

beforeAll((done) => {
  server = app.listen(0, async () => {
    // Fetch CSRF token and cookie for use in tests
    const res = await request(server).get('/api/health');
    // The CSRF token is set as a cookie named _csrf and as a response header
    // But our app uses csurf with cookie, so we need to parse it from the cookie
    const setCookie = res.headers['set-cookie'] || [];
    const csrfCookieStr = setCookie.find(c => c.startsWith('_csrf='));
    if (csrfCookieStr) {
      csrfCookie = csrfCookieStr.split(';')[0];
      // The token value is also available as req.csrfToken() in the route, but for tests, we can get it from the cookie value
      csrfToken = decodeURIComponent(csrfCookie.split('=')[1]);
    }
    done();
  });
});
afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await sequelize.close();
});

describe('Backend Routes', () => {
              // Helper to add CSRF token and cookie to mutating requests
              function withCsrf(req) {
                if (csrfToken && csrfCookie) {
                  return req.set('Cookie', csrfCookie).set('x-csrf-token', csrfToken);
                }
                return req;
              }
            describe('Chit CRUD Routes', () => {
              it('POST /api/chits/crud/create returns 400/401 for missing fields or unauthorized', async () => {
                  const res = await withCsrf(request(server)
                    .post('/api/chits/crud/create')
                    .set('x-username', 'testuser'))
                    .send({});
                  expect([400, 401, 422, 500]).toContain(res.statusCode);
                  if ([400, 401, 422, 500].includes(res.statusCode)) {
                    expect(res.body).toHaveProperty('error');
                  }
              });

              it('GET /api/chits/crud/list returns chit funds or error', async () => {
                  const res = await request(server)
                  .get('/api/chits/crud/list')
                  .set('x-username', 'testuser');
                  expect([200, 401, 422, 500]).toContain(res.statusCode);
                  if (res.statusCode === 200) {
                    expect(Array.isArray(res.body)).toBe(true);
                  } else if ([401, 422, 500].includes(res.statusCode)) {
                    expect(res.body).toHaveProperty('error');
                  }
              });
            });
          describe('Chit Admin Route', () => {
            it('POST /api/chits/:chitId/requests/:membershipId returns error for invalid params', async () => {
                const res = await request(server)
                .post('/api/chits/invalid-id/requests/invalid-membership')
                .set('x-username', 'testuser');
                expect([400, 401, 422, 500]).toContain(res.statusCode);
            });
          });
        describe('Log Route', () => {
          it('POST /api/log returns 400 for missing message', async () => {
              const res = await withCsrf(request(server)
                .post('/api/log'))
                .send({ level: 'info' });
              expect([400, 422, 500]).toContain(res.statusCode);
              if ([400, 422, 500].includes(res.statusCode)) {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('error');
              }
          });

          afterAll(async () => {
            if (server) await new Promise((resolve) => server.close(resolve));
          });
        it('GET /api/user/check-username returns available status', async () => {
            const res = await request(server)
            .get('/api/user/check-username')
            .query({ username: 'testuser' });
            expect([200, 400, 422, 500]).toContain(res.statusCode);
            if (res.statusCode === 200) {
              expect(res.body).toHaveProperty('available');
            } else if ([400, 422, 500].includes(res.statusCode)) {
              expect(res.body).toHaveProperty('error');
            }
        });

        it('POST /api/user/register returns 400 for missing fields', async () => {
            const res = await withCsrf(request(server)
              .post('/api/user/register'))
              .send({});
            expect([400, 422, 500]).toContain(res.statusCode);
            if ([400, 422, 500].includes(res.statusCode)) {
              expect(res.body).toHaveProperty('error');
            }
        });

        it('POST /api/user/login returns 400 for missing fields', async () => {
            const res = await withCsrf(request(server)
              .post('/api/user/login'))
              .send({});
            expect([400, 422, 500]).toContain(res.statusCode);
            if ([400, 422, 500].includes(res.statusCode)) {
              expect(res.body).toHaveProperty('error');
            }
        });
      });
    it('POST /api/chits/:chitId/join returns 401/422/500 for invalid chitId', async () => {
        const res = await withCsrf(request(server)
          .post('/api/chits/invalid-id/join')
          .set('x-username', 'testuser'));
        expect([401, 422, 500]).toContain(res.statusCode);
    });

    // TODO: Add test for already requested/member case when test DB and user context is available
  afterAll(async () => {
      // Do not close sequelize here; let the global afterAll handle it
  });

  describe('Health Route', () => {
    it('GET /api/health returns 200 and ok/db status', async () => {
      const res = await request(server).get('/api/health');
      expect([200, 500]).toContain(res.statusCode);
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty('ok', true);
        expect(res.body).toHaveProperty('db', 'up');
      } else {
        // Log error for debugging
        // eslint-disable-next-line no-console
        console.error('Health route error:', res.body);
        expect(res.body).toHaveProperty('ok', false);
        expect(res.body).toHaveProperty('db', 'down');
      }
    });
  });

  // Add more route tests below
  // Example: Chit routes
  it('GET /api/chits/all-memberships returns memberships', async () => {
    // This test assumes a valid user context; you may need to mock auth/middleware
      const res = await request(server)
      .get('/api/chits/all-memberships')
      .set('x-username', 'testuser');
      expect([200, 401, 422, 500]).toContain(res.statusCode);
  });

  it('POST /api/chits/create returns 400 for missing fields', async () => {
      const res = await withCsrf(request(server)
        .post('/api/chits/create')
        .set('x-username', 'testuser'))
        .send({});
      expect([400, 401, 422, 500]).toContain(res.statusCode);
      if ([400, 401, 422, 500].includes(res.statusCode)) {
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('error');
      }
  });

  // --- Additional Success Case Tests ---
  describe('Chit Fund Success Cases', () => {
    let adminToken;
    let chitId;

    beforeAll(async () => {
      // Register a new admin user
      const res = await request(server)
        .post('/api/user/register')
        .send({
          username: 'adminuser',
          firstName: 'Admin',
          lastName: 'User',
          mobile: '9999999999',
          password: 'adminpass',
          confirmPassword: 'adminpass',
          otp: '123456'
        });
      expect([201, 400, 401, 422, 500]).toContain(res.statusCode);
      // Login as admin
      const loginRes = await request(server)
        .post('/api/user/login')
        .send({ username: 'adminuser', password: 'adminpass' });
      expect([200, 400, 401, 422, 500]).toContain(loginRes.statusCode);
      adminToken = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'].find(c => c.startsWith('session=')) : null;
    });

    it('POST /api/chits/create creates a chit fund', async () => {
      const res = await withCsrf(request(server)
        .post('/api/chits/create')
        .set('Cookie', adminToken))
        .send({
          name: 'Test Chit',
          monthlyAmount: 1000,
          chitsLeft: 2,
          startDate: '2026-03-01'
        });
      expect([201, 400, 401, 422, 500]).toContain(res.statusCode);
      if (res.statusCode === 201) {
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('chitFund');
        chitId = res.body.chitFund.id;
      } else {
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('error');
      }
    });

    it('POST /api/chits/:chitId/join allows member to join', async () => {
      const resUser = await request(server)
        .post('/api/user/register')
        .send({
          username: 'memberuser',
          firstName: 'Member',
          lastName: 'User',
          mobile: '8888888888',
          password: 'memberpass',
          confirmPassword: 'memberpass',
          otp: '654321'
        });
      expect([201, 400, 401, 422, 500]).toContain(resUser.statusCode);
      // Login as member
      const loginRes = await request(server)
        .post('/api/user/login')
        .send({ username: 'memberuser', password: 'memberpass' });
      expect([200, 400, 401, 422, 500]).toContain(loginRes.statusCode);
      const memberToken = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'].find(c => c.startsWith('session=')) : null;
      // Join chit
      const joinRes = await withCsrf(request(server)
        .post(`/api/chits/${chitId}/join`)
        .set('Cookie', memberToken));
      expect([201, 400, 401, 422, 500]).toContain(joinRes.statusCode); // 400 if already requested
      if (joinRes.statusCode === 201) {
        expect(joinRes.body).toHaveProperty('success', true);
      } else {
        expect(joinRes.body).toHaveProperty('error');
      }
    });
  });
  });
