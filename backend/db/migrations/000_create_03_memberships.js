// Migration: Create Memberships table
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop Memberships table if it exists (dev only, not for prod)
    await queryInterface.dropTable('Memberships', { force: true }).catch(() => {});
    await queryInterface.createTable('Memberships', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true
      },
      UserId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      ChitFundId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'ChitFunds',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      role: {
        type: Sequelize.ENUM('admin', 'member'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'pending', 'rejected'),
        defaultValue: 'pending'
      },
      requestedBy: {
        type: Sequelize.ENUM('user', 'admin'),
        allowNull: false
      },
      approvals: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Memberships');
  }
};
