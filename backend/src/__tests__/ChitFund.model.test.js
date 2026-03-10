const ChitFund = require('../models/ChitFund');
const sequelize = require('../db/sequelize');

describe('ChitFund model', () => {
  it('should not create chit fund without required fields', async () => {
    expect.assertions(1);
    try {
      await ChitFund.create({});
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });

  it('should create chit fund with required fields', async () => {
    const chit = await ChitFund.create({
      name: 'Test Chit',
      monthlyAmount: 1000,
      chitsLeft: 10,
      startDate: new Date().toISOString().slice(0, 10)
    });
    expect(chit).toHaveProperty('id');
    expect(chit.name).toBe('Test Chit');
    await chit.destroy();
  });
});

afterAll(async () => {
  await sequelize.close();
});
