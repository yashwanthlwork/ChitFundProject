const { register } = require('../controllers/userController');
const User = require('../models/User');
const sequelize = require('../db/sequelize');

describe('userController', () => {
  describe('register', () => {
    it('should return 400 for missing fields', async () => {
      const req = { body: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await register(req, res, () => {});
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
  });
});

afterAll(async () => {
  await sequelize.close();
});
