module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Only add the column if it does not exist
    const table = await queryInterface.describeTable('Logs');
    if (!table.guid) {
      await queryInterface.addColumn('Logs', 'guid', {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        unique: true
      });
    }
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Logs', 'guid');
  }
};
