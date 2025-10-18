// One-off script to create/sync info_nugget_categories and info_nuggets tables
// Run from node-api folder: node scripts/create_info_nuggets_tables.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const path = require('path');
const { sequelize } = require('../src/models/relations');
const InfoNuggetCategory = require('../src/models/infoNuggetCategory');
const InfoNugget = require('../src/models/infoNugget');

(async () => {
  try {
    console.log('Connected to DB? pinging...');
    await sequelize.authenticate();
    console.log('DB connection OK');

    console.log('Syncing InfoNuggetCategory (may alter)...');
    await InfoNuggetCategory.sync({ alter: true });
    console.log('InfoNuggetCategory synced');

    console.log('Syncing InfoNugget (may alter)...');
    await InfoNugget.sync({ alter: true });
    console.log('InfoNugget synced');

    console.log('All done.');
    process.exit(0);
  } catch (err) {
    console.error('Error syncing tables:', err.message || err);
    console.error(err);
    process.exit(1);
  }
})();
