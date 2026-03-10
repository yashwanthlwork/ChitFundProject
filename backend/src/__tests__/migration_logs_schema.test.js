const { Sequelize } = require('sequelize');

describe('Logs table schema', () => {
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

  it('should have all required columns in Logs', async () => {
    const table = await queryInterface.describeTable('Logs');
    expect(table).toHaveProperty('guid');
    expect(table).toHaveProperty('action');
    expect(table).toHaveProperty('details');
    expect(table).toHaveProperty('userId');
    expect(table).toHaveProperty('chitFundId');
  });
});
