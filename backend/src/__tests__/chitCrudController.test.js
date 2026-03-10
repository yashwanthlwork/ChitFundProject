const sequelize = require('../db/sequelize');
afterAll(async () => {
  await sequelize.close();
});
const { createChitFund, listUserChits } = require('../controllers/chitCrudController');
const ChitFund = require('../models/ChitFund');

describe('chitCrudController', () => {
  describe('createChitFund', () => {
    it('should throw error for missing fields', async () => {
      const req = { body: {}, user: { id: 1, username: 'testuser' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await createChitFund(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
  });

  describe('listUserChits', () => {
    it('should return array of chit funds for user', async () => {
      const memberships = [{ ChitFund: { id: 1, name: 'Test Fund' }, role: 'admin' }];
      const Membership = require('../models/Membership');
      Membership.findAll = jest.fn().mockResolvedValue(memberships);
      const req = { user: { id: 1, username: 'testuser' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await listUserChits(req, res);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          { chitFund: { id: 1, name: 'Test Fund' }, role: 'admin' }
        ]
      });
    });
  });
});
