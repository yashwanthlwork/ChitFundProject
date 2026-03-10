const Log = require('../models/Log');
const sequelize = require('../db/sequelize');

describe('Log model', () => {
  it('should not create log without required fields', async () => {
    expect.assertions(1);
    try {
      await Log.create({});
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });

  it('should create log with required fields', async () => {
    const validGuid = '123e4567-e89b-12d3-a456-426614174000';
    const log = await Log.create({
      action: 'test_action',
      details: 'Test log details',
      userId: 'testuser',
      guid: validGuid
    });
    expect(log).toHaveProperty('id');
    expect(log.action).toBe('test_action');
    await log.destroy();
  });
});

afterAll(async () => {
  await sequelize.close();
});
