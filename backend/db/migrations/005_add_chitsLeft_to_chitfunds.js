module.exports = {
  up: async (queryInterface) => {
    // Only add the column if it does not exist
    const table = await queryInterface.describeTable('ChitFunds');
    if (!table.chitsLeft) {
      await queryInterface.addColumn('ChitFunds', 'chitsLeft', {
        type: 'INTEGER',
        allowNull: false,
        defaultValue: 0
      });
    }
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('ChitFunds', 'chitsLeft');
  }
};
