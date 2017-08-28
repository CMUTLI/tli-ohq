// Update with your config settings.

module.exports = {

  development: {
    client: 'postgresql',
    connection: {
      host:     'oh-queue-test.cp8o9vh5dfoa.us-east-1.rds.amazonaws.com',
      port:     '5432',
      database: process.env.DB_NAME, 
      user:     'queue',
      password: 'supersecret'
    },
    pool: {
      min: 1,
      max: 1
    },
    migrations: {
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds/dev'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      host:     'oh-queue-prod.cp8o9vh5dfoa.us-east-1.rds.amazonaws.com',
      port:     '5432',
      database: process.env.DB_NAME,
      user:     'queue',
      password: 'supersecret'
    },
    pool: {
      min: 1,
      max: 1
    },
    migrations: {
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds/prod'
    }
  },


};
