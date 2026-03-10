// Minimal migration runner for a single migration file
const { Sequelize } = require('sequelize');

const config = {
  username: 'Yashwanth',
  password: '',
  database: 'chitfund',
  host: '127.0.0.1',
  dialect: 'postgres'
};

const sequelize = new Sequelize(config.database, config.username, config.password, config);
const queryInterface = sequelize.getQueryInterface();

async function runSingleMigration() {
  const migration = require('./000_create_01_users.js');
  if (migration.up) {
    console.log('Running 000_create_01_users.js...');
    await migration.up(queryInterface, Sequelize);
    console.log('Migration completed successfully.');
  } else {
    throw new Error('No up method found in migration.');
  }
  await sequelize.close();
}

runSingleMigration().catch(e => {
  console.error(e);
  process.exit(1);
});
