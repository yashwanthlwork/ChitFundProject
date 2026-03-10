// Membership model (user-chitfund join table with role)
const { DataTypes } = require('sequelize');
const ChitFund = require('./ChitFund');
const User = require('./User');
const sequelize = require('../db/sequelize');


const Membership = sequelize.define('Membership', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  UserId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  ChitFundId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  role: { type: DataTypes.ENUM('admin', 'member'), allowNull: false },
  status: { type: DataTypes.ENUM('active', 'pending', 'rejected'), defaultValue: 'pending' },
  requestedBy: { type: DataTypes.ENUM('user', 'admin'), allowNull: false },
  approvals: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] }
});

User.belongsToMany(ChitFund, { through: Membership });
ChitFund.belongsToMany(User, { through: Membership });
Membership.belongsTo(User);
Membership.belongsTo(ChitFund);

module.exports = Membership;
