const { execSync } = require('child_process');
const path = require('path');
const sequelize = require('../db/sequelize');
const User = require('../models/User');

describe('truncateAll script', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    await User.truncate({ cascade: true, restartIdentity: true });
    try {
      await User.create({ username: 'testuser', password: 'pw', firstName: 'a', lastName: 'b', mobile: '1' });
    } catch (err) {
      console.error('User.create failed:', err);
      throw err;
    }
  });

  it('should truncate all tables and remove all users', async () => {
    execSync(`node ${path.resolve(__dirname, '../../../backend/truncateAll.js')}`);
    const users = await User.findAll();
    expect(users.length).toBe(0);
  });

  afterAll(async () => {
    await sequelize.close();
  });
});
