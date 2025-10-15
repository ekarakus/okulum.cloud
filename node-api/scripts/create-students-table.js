const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { sequelize } = require('../src/models/relations');

(async () => {
  try {
    console.log('Authenticating...');
    await sequelize.authenticate();
    console.log('Authenticated. Running sync({ alter: true }) for students model...');
    await sequelize.sync({ alter: true });
    console.log('Sync complete.');
    process.exit(0);
  } catch (err) {
    console.error('Sync error:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
