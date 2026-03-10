const { Sequelize } = require('sequelize');

describe('ChitFunds table schema', () => {
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

  it('should have a description column in ChitFunds', async () => {
    const table = await queryInterface.describeTable('ChitFunds');
    expect(table).toHaveProperty('description');
    expect(table.description.type).toMatch(/text/i);
  });
});
