require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const path = require('path');

async function run() {
  try {
    const rel = require(path.join(__dirname, '..', 'src', 'models', 'relations'));
    const { sequelize, UserPermission } = rel;

    console.log('Authenticating DB connection...');
    await sequelize.authenticate();
    console.log('DB connection OK');

    console.log('Syncing UserPermission model (alter)...');
    await UserPermission.sync({ alter: true });
    console.log('UserPermission table synced/created successfully');

    await sequelize.close();
    console.log('Done.');
  } catch (err) {
    console.error('Error syncing UserPermission table:', (err && err.message) || err);
    process.exit(1);
  }
}

run();
