

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Use raw SQL to cast UUID to text
    await queryInterface.sequelize.query(`
      ALTER TABLE "Logs"
      ALTER COLUMN "userId" TYPE TEXT USING "userId"::text;
    `);
    await queryInterface.changeColumn('Logs', 'userId', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },
  down: async (queryInterface, Sequelize) => {
    // Use raw SQL to cast text back to UUID (may fail if data is not valid UUID)
    await queryInterface.sequelize.query(`
      ALTER TABLE "Logs"
      ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;
    `);
    await queryInterface.changeColumn('Logs', 'userId', {
      type: Sequelize.UUID,
      allowNull: true
    });
  }
};
