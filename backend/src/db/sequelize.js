
// Sequelize instance for PostgreSQL
const { Sequelize } = require('sequelize');

// Use environment variables for connection details
const DB_NAME = process.env.PG_DB || 'chitfund';
const DB_USER = process.env.PG_USER || process.env.PGUSER || 'Yashwanth';
const DB_PASS = process.env.PG_PASS || '';
const DB_HOST = process.env.PG_HOST || 'localhost';
const DB_PORT = process.env.PG_PORT || 5432;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
	host: DB_HOST,
	port: DB_PORT,
	dialect: 'postgres',
	logging: false,
});

module.exports = sequelize;
