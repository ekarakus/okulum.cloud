const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Student = require('../src/models/student');

(async () => {
  try {
    console.log('Syncing Student model only...');
    await Student.sync({ alter: true });
    console.log('Student table synced/created successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Student sync error:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
