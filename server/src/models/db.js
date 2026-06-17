const knex = require('knex');

const connection = process.env.DATABASE_URL || {
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'inventory_db',
  user: process.env.DB_USER || 'its_user',
  password: process.env.DB_PASSWORD,
};

module.exports = knex({
  client: 'pg',
  connection,
  pool: { min: 2, max: 10 },
});
