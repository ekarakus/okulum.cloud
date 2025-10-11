const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  jwtSecret: required('JWT_SECRET'),
  db: {
    host: required('DB_HOST'),
    port: Number(process.env.DB_PORT || required('DB_PORT')),
    database: required('DB_NAME'),
    user: required('DB_USER'),
    password: required('DB_PASS'),
    ssl: process.env.DB_SSL === 'true' || false,
    sslRejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' || false,
  },
  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
  testUserEmail: process.env.TEST_USER_EMAIL,
  testPassword: process.env.TEST_PASSWORD,
  frontendBaseUrl: process.env.FRONTEND_BASE_URL,
};

module.exports = config;
