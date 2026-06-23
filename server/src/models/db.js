const knex = require('knex');
const config = require('../../knexfile');

const env = process.env.NODE_ENV || 'development';

const db = knex(config[env]);

// Test connection on startup
db.raw('SELECT 1')
  .then(() => console.log('✅ PostgreSQL connected'))
  .catch((err) => {
    console.error('❌ PostgreSQL connection failed:', err.message);
    process.exit(1);
  });

module.exports = db;
