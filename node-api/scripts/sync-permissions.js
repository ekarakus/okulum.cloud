// Quick helper to sync the Permission model (create table if missing)
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const path = require('path');

async function run() {
  try {
    // Load relations which define models and export Permission
    const rel = require(path.join(__dirname, '..', 'src', 'models', 'relations'));
    const { sequelize, Permission } = rel;

    console.log('Authenticating DB connection...');
    await sequelize.authenticate();
    console.log('DB connection OK');

    console.log('Syncing Permission model (alter)...');
    await Permission.sync({ alter: true });
    console.log('Permission table synced/created successfully');

    await sequelize.close();
    console.log('Done.');
  } catch (err) {
    console.error('Error syncing Permission table:', (err && err.message) || err);
    process.exit(1);
  }
}

run();
