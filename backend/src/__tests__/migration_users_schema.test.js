const { Sequelize } = require('sequelize');

describe('Users table schema', () => {
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

  it('should have all required columns in Users', async () => {
    const table = await queryInterface.describeTable('Users');
    expect(table).toHaveProperty('username');
    expect(table).toHaveProperty('password');
    expect(table).toHaveProperty('firstName');
    expect(table).toHaveProperty('lastName');
    expect(table).toHaveProperty('mobile');
    expect(table).toHaveProperty('picture');
  });
});
