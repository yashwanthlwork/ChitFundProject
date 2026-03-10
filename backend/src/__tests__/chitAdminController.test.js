const { handleRequestAction } = require('../controllers/chitAdminController');
const Membership = require('../models/Membership');
const sequelize = require('../db/sequelize');

describe('chitAdminController', () => {
  describe('handleRequestAction', () => {
    it('should return 400 for missing params', async () => {
      const req = { params: {}, user: { id: 1, username: 'admin' }, body: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await handleRequestAction(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
  });
});

afterAll(async () => {
  await sequelize.close();
});
