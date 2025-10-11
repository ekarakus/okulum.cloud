require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize } = require('../src/models/relations');
const EmployeeType = require('../src/models/employeeType');

(async () => {
  try {
    console.log('Authenticating DB connection...');
    await sequelize.authenticate();
    console.log('DB connection OK');

    console.log('Syncing EmployeeType model (alter)...');
    await EmployeeType.sync({ alter: true });
    console.log('EmployeeType table synced/created successfully');
  } catch (err) {
    console.error('Sync error', err);
    process.exit(1);
  }
})();
