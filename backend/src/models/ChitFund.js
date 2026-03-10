// ChitFund model
const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');


const ChitFund = sequelize.define('ChitFund', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: { type: DataTypes.STRING, allowNull: false },
  monthlyAmount: { type: DataTypes.INTEGER, allowNull: false },
  chitsLeft: { type: DataTypes.INTEGER, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  startDate: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW }
});

module.exports = ChitFund;
