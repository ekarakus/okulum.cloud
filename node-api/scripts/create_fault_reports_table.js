// Run with: node scripts/create_fault_reports_table.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const path = require('path');
const { sequelize } = require('../src/models/relations');
const FaultReport = require('../src/models/faultReport');

(async () => {
  try {
    console.log('Connecting to DB...');
    await sequelize.authenticate();
    console.log('DB connection OK');

    console.log('Syncing FaultReport (may alter)...');
    await FaultReport.sync({ alter: true });
    console.log('FaultReport synced');

    console.log('All done.');
    process.exit(0);
  } catch (err) {
    console.error('Error syncing FaultReport table:', err.message || err);
    console.error(err);
    process.exit(1);
  }
})();
