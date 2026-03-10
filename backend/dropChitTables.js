// Script to drop ChitFunds and Memberships tables using Sequelize
const sequelize = require('./src/db/sequelize');

async function dropTables() {
  try {
    await sequelize.query('DROP TABLE IF EXISTS "Memberships" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "ChitFunds" CASCADE;');
    console.log('Dropped Memberships and ChitFunds tables.');
    process.exit(0);
  } catch (err) {
    console.error('Error dropping tables:', err);
    process.exit(1);
  }
}

dropTables();
