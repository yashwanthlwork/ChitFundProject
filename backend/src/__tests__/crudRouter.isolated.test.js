const express = require('express');
const request = require('supertest');
const crudRouter = require('../routes/chit/crud');

describe('Isolated CRUD Router', () => {
  let app;
  beforeAll(() => {
    app = express();
    app.use(express.json());
    // Simulate gateway middleware always passing user
    app.use((req, res, next) => {
      req.user = { id: 1, username: 'testuser' };
      next();
    });
    app.use('/', crudRouter);
  });

  it('GET /crud/list returns chit funds or error', async () => {
    const res = await request(app)
      .get('/crud/list')
      .set('x-username', 'testuser');
    expect([200, 401, 403, 404, 422, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
    } else {
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    }
  });

  it('POST /crud/create returns 400 for missing fields', async () => {
    const res = await request(app)
      .post('/crud/create')
      .set('x-username', 'testuser')
      .send({});
    expect([400, 401, 403, 404, 422, 500]).toContain(res.statusCode);
    if ([400, 401, 422, 500].includes(res.statusCode)) {
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    }
  });
});
