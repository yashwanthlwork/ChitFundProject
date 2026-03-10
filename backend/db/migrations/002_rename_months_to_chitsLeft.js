// Migration: Rename 'months' to 'chitsLeft' in ChitFunds table
// Migration: Rename 'months' to 'chitsLeft' in ChitFunds table, only if 'months' exists
module.exports = {
  up: async (queryInterface) => {
    const table = await queryInterface.describeTable('ChitFunds');
    if (table.months) {
      await queryInterface.renameColumn('ChitFunds', 'months', 'chitsLeft');
    }
  },
  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('ChitFunds');
    if (table.chitsLeft && !table.months) {
      await queryInterface.renameColumn('ChitFunds', 'chitsLeft', 'months');
    }
  }
};
