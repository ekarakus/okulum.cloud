const { Sequelize } = require('sequelize');

// Local ve Railway ortam değişkenlerini destekleyen yapı
const sequelize = new Sequelize(
  process.env.MYSQLDATABASE || process.env.DB_NAME, // Local: DB_NAME, Railway: MYSQLDATABASE
  process.env.MYSQLUSER || process.env.DB_USER,     // Local: DB_USER, Railway: MYSQLUSER
  process.env.MYSQLPASSWORD || process.env.DB_PASS, // Local: DB_PASS, Railway: MYSQLPASSWORD
  {
    host: process.env.MYSQLHOST || process.env.DB_HOST, // Local: DB_HOST, Railway: MYSQLHOST
    port: process.env.MYSQLPORT || process.env.DB_PORT, // Local: DB_PORT, Railway: MYSQLPORT
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      connectTimeout: 60000,
      // Railway için SSL ayarları genellikle gereklidir
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false,
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

// Bu yardımcı fonksiyonu da doğru değişkenleri kullanacak şekilde güncelledim.
const createDatabase = async () => {
  const tempSequelize = new Sequelize('', 
    process.env.MYSQLUSER || process.env.DB_USER, 
    process.env.MYSQLPASSWORD || process.env.DB_PASS, {
    host: process.env.MYSQLHOST || process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
  });
  try {
    await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.MYSQLDATABASE}\`;`);
    console.log(`Database ${process.env.MYSQLDATABASE} created or already exists`);
  } catch (error) {
    // Railway'de bu fonksiyonun çalışması için özel izinler gerekebilir,
    // genellikle veritabanı zaten oluşturulmuş olduğu için bu adıma gerek kalmaz.
    // Hata verirse endişelenmeyin.
    console.error('Error creating database (this might be expected on Railway):', error.message);
  } finally {
    await tempSequelize.close();
  }
};

module.exports = { sequelize, createDatabase };