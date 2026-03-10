// Log model
const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const Log = sequelize.define('Log', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  guid: {
    type: DataTypes.UUID,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
    unique: true
  },
  action: { type: DataTypes.STRING, allowNull: false },
  details: { type: DataTypes.TEXT, allowNull: true },
  userId: { type: DataTypes.STRING, allowNull: true },
  chitFundId: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'Logs',
  timestamps: true
});

module.exports = Log;
