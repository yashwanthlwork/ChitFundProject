// Simple migration runner for all migration files in this directory
const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

// Use PG_DB env var if set, else default to chitfund_test
const DB_NAME = process.env.PG_DB || 'chitfund';
const DB_USER = process.env.PG_USER || process.env.PGUSER || 'Yashwanth';
const DB_PASS = process.env.PG_PASS || '';
const DB_HOST = process.env.PG_HOST || 'localhost';
const DB_PORT = process.env.PG_PORT || 5432;
const DB_URL = process.env.TEST_DATABASE_URL || `postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
const sequelize = new Sequelize(DB_URL, { logging: false });
const queryInterface = sequelize.getQueryInterface();

async function runMigrations() {
  const migrationDir = __dirname;
  const files = fs.readdirSync(migrationDir)
    .filter(f => f.endsWith('.js') && f.match(/^[0-9]+.*\.js$/))
    .sort();

  // 1. Ensure migration tracking table exists (industry standard: SequelizeMeta)
  await queryInterface.sequelize.query(`CREATE TABLE IF NOT EXISTS "SequelizeMeta" (name VARCHAR(255) PRIMARY KEY);`);
  // 2. Get list of already applied migrations
  const [appliedRows] = await queryInterface.sequelize.query('SELECT name FROM "SequelizeMeta";');
  const applied = new Set(appliedRows.map(r => r.name));

  // 3. Only run migrations that have not been applied
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[MIGRATION] Skipping already applied: ${file}`);
      continue;
    }
    const migrationPath = path.join(migrationDir, file);
    console.log(`[MIGRATION] Starting: ${file}`);
    try {
      const migration = require(migrationPath);
      if (migration.up) {
        console.log(`[MIGRATION] Running up: ${file}`);
        await migration.up(queryInterface, Sequelize);
        // 4. Record migration as applied
        await queryInterface.sequelize.query('INSERT INTO "SequelizeMeta" (name) VALUES (:name);', { replacements: { name: file } });
        console.log(`[MIGRATION] Success: ${file}`);
      } else {
        console.error(`[MIGRATION] ERROR: No up method in ${file}`);
      }
    } catch (err) {
      console.error(`[MIGRATION] ERROR in ${file}:`, err);
      throw err;
    }
    console.log(`[MIGRATION] Finished: ${file}`);
  }
  await sequelize.close();
  console.log('All migrations applied.');
}

runMigrations().catch(e => {
  console.error(e);
  process.exit(1);
});
