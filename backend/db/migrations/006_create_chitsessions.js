// Migration: create ChitSessions table for session history
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ChitSessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true
      },
      chitFundId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'ChitFunds', key: 'id' },
        onDelete: 'CASCADE'
      },
      sessionNumber: { type: Sequelize.INTEGER, allowNull: false },
      date: { type: Sequelize.DATEONLY, allowNull: false, defaultValue: Sequelize.NOW },
      bidAmount: { type: Sequelize.INTEGER, allowNull: false },
      finalQuote: { type: Sequelize.INTEGER, allowNull: false },
      winnerId: { type: Sequelize.UUID, allowNull: false },
      winnerGets: { type: Sequelize.INTEGER, allowNull: false },
      interestPool: { type: Sequelize.INTEGER, allowNull: false },
      beneficiaries: { type: Sequelize.ARRAY(Sequelize.UUID), allowNull: false },
      interestPerPerson: { type: Sequelize.INTEGER, allowNull: false },
      isCompleted: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('ChitSessions');
  }
};
