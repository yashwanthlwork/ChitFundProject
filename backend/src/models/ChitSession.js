// ChitSession model: tracks each session (draw) in a chit fund
const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');
const ChitFund = require('./ChitFund');

const ChitSession = sequelize.define('ChitSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  chitFundId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'ChitFunds', key: 'id' }
  },
  sessionNumber: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  bidAmount: { type: DataTypes.INTEGER, allowNull: false },
  finalQuote: { type: DataTypes.INTEGER, allowNull: false },
  winnerId: { type: DataTypes.UUID, allowNull: false },
  winnerGets: { type: DataTypes.INTEGER, allowNull: false },
  interestPool: { type: DataTypes.INTEGER, allowNull: false },
  beneficiaries: { type: DataTypes.ARRAY(DataTypes.UUID), allowNull: false },
  interestPerPerson: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: false },
  isCompleted: { type: DataTypes.BOOLEAN, defaultValue: false }
});

ChitSession.belongsTo(ChitFund, { foreignKey: 'chitFundId' });

module.exports = ChitSession;
