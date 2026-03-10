const Membership = require('../models/Membership');
const User = require('../models/User');
const ChitFund = require('../models/ChitFund');
const sequelize = require('../db/sequelize');

describe('Membership model', () => {
  let user, chitFund;

  beforeAll(async () => {
    user = await User.create({
      username: 'membershiptestuser',
      password: 'testpass',
      firstName: 'Test',
      lastName: 'User',
      mobile: '9999999999'
    });
    chitFund = await ChitFund.create({
      name: 'Membership Test Chit',
      monthlyAmount: 1000,
      chitsLeft: 5
    });
  });

  afterAll(async () => {
    await Membership.destroy({ where: { UserId: user.id, ChitFundId: chitFund.id } });
    await user.destroy();
    await chitFund.destroy();
    await sequelize.close();
  });

  it('should not create membership without required fields', async () => {
    expect.assertions(1);
    try {
      await Membership.create({});
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });

  it('should create membership with required fields', async () => {
    const membership = await Membership.create({
      UserId: user.id,
      ChitFundId: chitFund.id,
      role: 'member',
      status: 'pending',
      requestedBy: 'user'
    });
    expect(membership).toHaveProperty('id');
    expect(membership.role).toBe('member');
    await membership.destroy();
  });
});
