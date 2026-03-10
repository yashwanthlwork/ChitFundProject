const { Sequelize } = require('sequelize');

describe('Memberships table schema', () => {
  let sequelize;
  let queryInterface;

  beforeAll(async () => {
    sequelize = new Sequelize(process.env.TEST_DATABASE_URL || 'postgres://localhost:5432/chitfund_test', { logging: false });
    queryInterface = sequelize.getQueryInterface();
    await sequelize.authenticate();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should have all required columns in Memberships', async () => {
    const table = await queryInterface.describeTable('Memberships');
    expect(table).toHaveProperty('UserId');
    expect(table).toHaveProperty('ChitFundId');
    expect(table).toHaveProperty('role');
    expect(table).toHaveProperty('status');
    expect(table).toHaveProperty('requestedBy');
    expect(table).toHaveProperty('approvals');
  });
});
