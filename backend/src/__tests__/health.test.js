
const request = require('supertest');
const express = require('express');
const app = require('../app');
const sequelize = require('../db/sequelize');

let server;


beforeAll((done) => {
  server = app.listen(0, done);
});

describe('Health Route', () => {
  it('should return 200 and ok/db status', async () => {
    const res = await request(server).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('db', 'up');
  });
});


afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await sequelize.close();
});
