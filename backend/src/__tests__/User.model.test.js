const User = require('../models/User');
const sequelize = require('../db/sequelize');

describe('User model', () => {
  it('should not create user without required fields', async () => {
    expect.assertions(1);
    try {
      await User.create({});
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });

  it('should create user with required fields', async () => {
    const user = await User.create({
      username: 'testuser',
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      mobile: '1234567890'
    });
    expect(user).toHaveProperty('id');
    expect(user.username).toBe('testuser');
    await user.destroy();
  });
});

afterAll(async () => {
  await sequelize.close();
});
