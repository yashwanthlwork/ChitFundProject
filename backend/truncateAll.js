// Script to truncate all tables (clear all data, keep schema)
const sequelize = require('./src/db/sequelize');
const ChitFund = require('./src/models/ChitFund');
const Log = require('./src/models/Log');
const Membership = require('./src/models/Membership');
const User = require('./src/models/User');
const logToFile = require('./src/utils/logToFile');

async function truncateAll() {
  try {
    await sequelize.authenticate();
    // Disable foreign key checks
    await sequelize.query('SET session_replication_role = replica;');
    await Log.truncate({ cascade: true, restartIdentity: true });
    await Membership.truncate({ cascade: true, restartIdentity: true });
    await ChitFund.truncate({ cascade: true, restartIdentity: true });
    await User.truncate({ cascade: true, restartIdentity: true });
    // Re-enable foreign key checks
    await sequelize.query('SET session_replication_role = DEFAULT;');
    logToFile('All data truncated.');
    process.exit(0);
  } catch (err) {
    logToFile('Error truncating tables:', err);
    if (typeof console !== 'undefined' && console.error) console.error('truncateAll error:', err);
    process.exit(1);
  }
}

truncateAll();
