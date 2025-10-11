const { Sequelize } = require('sequelize');
const config = require('../../config');

// Sequelize using central config
const sequelize = new Sequelize(
  config.db.database,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql',
    logging: config.nodeEnv === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      connectTimeout: 60000,
      ssl: config.db.ssl ? { require: true, rejectUnauthorized: config.db.sslRejectUnauthorized } : false,
    },
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ],
      max: 5
    }
  }
);

// createDatabase helper (development use only)
const createDatabase = async () => {
  const tempSequelize = new Sequelize('', config.db.user, config.db.password, {
    host: config.db.host,
    dialect: 'mysql',
    logging: false,
  });
  try {
    await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\`;`);
    console.log(`Database ${config.db.database} created or already exists`);
  } catch (error) {
    console.error('Error creating database:', error.message);
  } finally {
    await tempSequelize.close();
  }
};

module.exports = { sequelize, createDatabase };