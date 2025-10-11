require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize } = require('../src/models/relations');
const SchoolEmployee = require('../src/models/schoolEmployee');

(async () => {
  try {
    console.log('Authenticating DB connection...');
    await sequelize.authenticate();
    console.log('DB connection OK');

    console.log('Syncing SchoolEmployee model (alter)...');
    await SchoolEmployee.sync({ alter: true });
    console.log('SchoolEmployee table synced/created successfully');
  } catch (err) {
    console.error('Sync error', err);
    process.exit(1);
  }
})();
