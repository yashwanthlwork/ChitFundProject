// 006_change_log_userid_to_text.js


module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Logs', 'userId', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Logs', 'userId', {
      type: Sequelize.UUID,
      allowNull: true,
    });
  }
};
