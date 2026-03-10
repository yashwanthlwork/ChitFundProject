/*
  Automated backend route tests for critical endpoints using supertest and jest.
  - Tests: login, registration, chit creation, health, log
*/

const request = require('supertest');
const app = require('../app');
let server;

beforeAll((done) => {
  server = app.listen(0, done);
});

afterAll((done) => {
  server.close(done);
});

describe('Backend Route Tests', () => {
  it('GET /api/health should return 200', async () => {
    const res = await request(server).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status');
  });

  // Add more tests for registration, login, chit creation, etc.
});
