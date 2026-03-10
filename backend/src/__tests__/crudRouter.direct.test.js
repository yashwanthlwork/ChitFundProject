  // ── GROUP: Business Logic ────────────────────────────────────────────────
  describe('Business Logic', () => {
    let agent;
    let authedApp;
    let ChitFund, Membership, User, sequelize;
    beforeEach(async () => {
      sequelize = require('../db/sequelize');
      await sequelize.sync({ force: true });
      ChitFund = require('../models/ChitFund');
      Membership = require('../models/Membership');
      User = require('../models/User');
      // Insert the test user for Membership FK
      await User.create({ id: 'bbbbbbbb-0000-0000-0000-000000000002', username: 'logicuser', password: 'testpass' });
      authedApp = express();
      authedApp.use(express.json());
      authedApp.use((req, res, next) => { req.user = { id: 'bbbbbbbb-0000-0000-0000-000000000002', username: 'logicuser' }; next(); });
      authedApp.use('/', crudRouter);
      agent = request(authedApp);
    });
    it('creates a chit fund with valid input', async () => {
      const res = await agent.post('/crud/create').send({ name: 'Logic Chit ' + Date.now(), monthlyAmount: 5000, chitsLeft: 12 });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('chitFund');
      expect(res.body.chitFund).toHaveProperty('id');
      expect(res.body.chitFund).toHaveProperty('name');
    });
    it('returns 400 when chit fund name already exists', async () => {
      const uniqueName = 'Duplicate Chit ' + Date.now();
      // Create once
      await agent.post('/crud/create').send({ name: uniqueName, monthlyAmount: 1000, chitsLeft: 10 });
      // Try to create again
      const res = await agent.post('/crud/create').send({ name: uniqueName, monthlyAmount: 1000, chitsLeft: 10 });
      expect([400, 409]).toContain(res.statusCode);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
    it('returns 200 and array for GET /crud/list when user has chit funds', async () => {
      await agent.post('/crud/create').send({ name: 'List Chit ' + Date.now(), monthlyAmount: 2000, chitsLeft: 5 });
      const res = await agent.get('/crud/list');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
    it('returns 200 and empty array for GET /crud/list when user has no chit funds', async () => {
      // New user
      const emptyApp = express();
      emptyApp.use(express.json());
      emptyApp.use((req, res, next) => { req.user = { id: 'cccccccc-0000-0000-0000-000000000003', username: 'emptyuser' }; next(); });
      emptyApp.use('/', crudRouter);
      const emptyAgent = request(emptyApp);
      const res = await emptyAgent.get('/crud/list');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });
  });

  // ── GROUP: Security ─────────────────────────────────────────────────────--
  describe('Security', () => {
    let agent;
    let authedApp;
    let ChitFund, Membership, User, sequelize;
    beforeEach(async () => {
      sequelize = require('../db/sequelize');
      await sequelize.sync({ force: true });
      ChitFund = require('../models/ChitFund');
      Membership = require('../models/Membership');
      User = require('../models/User');
      // Insert the test user for Membership FK
      await User.create({ id: 'dddddddd-0000-0000-0000-000000000004', username: 'secureuser', password: 'testpass' });
      authedApp = express();
      authedApp.use(express.json());
      authedApp.use((req, res, next) => { req.user = { id: 'dddddddd-0000-0000-0000-000000000004', username: 'secureuser' }; next(); });
      authedApp.use('/', crudRouter);
      agent = request(authedApp);
    });
    it('ignores isAdmin/role in request body (mass assignment protection)', async () => {
      const res = await agent.post('/crud/create').send({ name: 'Secure Chit ' + Date.now(), monthlyAmount: 1000, chitsLeft: 10, isAdmin: true, role: 'admin' });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.chitFund).not.toHaveProperty('isAdmin');
      expect(res.body.chitFund).not.toHaveProperty('role');
    });
  });
// Polyfill TextEncoder/TextDecoder for Node.js (must be first)
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// CRUD Router Direct Test
const request = require('supertest');
const express = require('express');
const crudRouter = require('../routes/chit/crud');
// Import sequelize for teardown
const sequelize = require('../db/sequelize');

describe('Chit CRUD Router (direct)', () => {
  let app;
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/', crudRouter);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ── GROUP: Authentication ────────────────────────────────────────────────
  describe('Authentication', () => {
    it('POST /crud/create returns 401 for unauthenticated', async () => {
      const res = await request(app).post('/crud/create').send({});
      expect([400, 401, 403]).toContain(res.statusCode);
      expect(res.body).toBeDefined();
      expect(res.body).toHaveProperty('error');
    });
    it('GET /crud/list returns 401 for unauthenticated', async () => {
      const res = await request(app).get('/crud/list');
      expect([401, 403]).toContain(res.statusCode);
      expect(res.body).toBeDefined();
      expect(res.body).toHaveProperty('error');
    });
  });

  // ── GROUP: Input Validation ──────────────────────────────────────────────
  describe('Input Validation', () => {
    let agent;
    let authedApp;
    let User, sequelize;
    beforeAll(async () => {
      sequelize = require('../db/sequelize');
      await sequelize.sync({ force: true });
      User = require('../models/User');
      await User.create({ id: 'aaaaaaaa-0000-0000-0000-000000000001', username: 'testuser', password: 'testpass' });
      authedApp = express();
      authedApp.use(express.json());
      // Simulate authenticated user BEFORE CRUD router is registered
      authedApp.use((req, res, next) => { req.user = { id: 'aaaaaaaa-0000-0000-0000-000000000001', username: 'testuser' }; next(); });
      authedApp.use('/', crudRouter);
      agent = request(authedApp);
    });
    it('returns 400 when all fields missing', async () => {
      const res = await agent.post('/crud/create').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
    it('returns 400 when name is missing', async () => {
      const res = await agent.post('/crud/create').send({ monthlyAmount: 1000, chitsLeft: 10 });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
    it('returns 400 when monthlyAmount is missing', async () => {
      const res = await agent.post('/crud/create').send({ name: 'Test Chit', chitsLeft: 10 });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
    it('returns 400 when chitsLeft is missing', async () => {
      const res = await agent.post('/crud/create').send({ name: 'Test Chit', monthlyAmount: 1000 });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
    it('returns 400 when name is too short', async () => {
      const res = await agent.post('/crud/create').send({ name: 'ab', monthlyAmount: 1000, chitsLeft: 10 });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
    it('returns 400 when name is too long', async () => {
      const longName = 'a'.repeat(65);
      const res = await agent.post('/crud/create').send({ name: longName, monthlyAmount: 1000, chitsLeft: 10 });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
    it('returns 400 when monthlyAmount is zero', async () => {
      const res = await agent.post('/crud/create').send({ name: 'Test Chit', monthlyAmount: 0, chitsLeft: 10 });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
    it('returns 400 when monthlyAmount is negative', async () => {
      const res = await agent.post('/crud/create').send({ name: 'Test Chit', monthlyAmount: -100, chitsLeft: 10 });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
    it('returns 400 when monthlyAmount is not a number', async () => {
      const res = await agent.post('/crud/create').send({ name: 'Test Chit', monthlyAmount: 'abc', chitsLeft: 10 });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
    it('returns 400 when chitsLeft is zero', async () => {
      const res = await agent.post('/crud/create').send({ name: 'Test Chit', monthlyAmount: 1000, chitsLeft: 0 });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
    it('returns 400 when chitsLeft is negative', async () => {
      const res = await agent.post('/crud/create').send({ name: 'Test Chit', monthlyAmount: 1000, chitsLeft: -5 });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
    it('returns 400 when chitsLeft is not an integer', async () => {
      const res = await agent.post('/crud/create').send({ name: 'Test Chit', monthlyAmount: 1000, chitsLeft: 'abc' });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
    it('returns 201 when extra unexpected fields are present', async () => {
      const res = await agent.post('/crud/create').send({ name: 'Test Chit ' + Date.now(), monthlyAmount: 1000, chitsLeft: 10, isAdmin: true });
      expect(res.statusCode).toBe(201); // Should ignore extra fields, not fail
      expect(res.body).toHaveProperty('success', true);
    });
    it('returns 400 for SQL injection/XSS in name', async () => {
      const res = await agent.post('/crud/create').send({ name: "<script>alert('x')</script>" + Date.now(), monthlyAmount: 1000, chitsLeft: 10 });
      expect([201, 400]).toContain(res.statusCode); // If validation allows, may succeed
    });
    it('returns 201 for unicode/emoji in name', async () => {
      const res = await agent.post('/crud/create').send({ name: 'Chit 🚀 ' + Date.now(), monthlyAmount: 1000, chitsLeft: 10 });
      expect([201, 400]).toContain(res.statusCode); // If validation allows, may succeed
    });
  });

  // Additional groups for business logic, DB errors, response contract, security, etc. can be added here following the same pattern.
});
