// Backfill script: copies values from user_id -> created_by_user_id when applicable
// Run with: node scripts/backfill_created_by.js --apply

const mysql = require('mysql2/promise');
const config = require('../config');

(async () => {
  const conn = await mysql.createConnection({ host: config.db.host, port: config.db.port, user: config.db.user, password: config.db.password, database: config.db.database });
  try {
    const [cols] = await conn.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'fault_reports' AND COLUMN_NAME IN ('user_id','created_by_user_id')", [config.db.database]);
    const colNames = (cols || []).map(r => r.COLUMN_NAME);
    const hasUserId = colNames.includes('user_id');
    const hasCreated = colNames.includes('created_by_user_id');
    console.log('has user_id:', hasUserId, 'has created_by_user_id:', hasCreated);
    if (!hasCreated) {
      console.log('created_by_user_id column not present. Adding column...');
      await conn.query('ALTER TABLE fault_reports ADD COLUMN created_by_user_id INT NULL');
      console.log('created_by_user_id added');
    }

    if (!hasUserId) {
      console.log('No user_id column present to backfill from; nothing to do.');
      process.exit(0);
    }

    const [rows] = await conn.query('SELECT COUNT(*) as cnt FROM fault_reports WHERE created_by_user_id IS NULL AND user_id IS NOT NULL');
    const toUpdate = rows && rows[0] ? rows[0].cnt : 0;
    console.log(`Rows to update: ${toUpdate}`);

    const apply = process.argv.includes('--apply');
    if (!apply) {
      console.log('Dry run. To apply changes, run: node scripts/backfill_created_by.js --apply');
      process.exit(0);
    }

    console.log('Applying backfill...');
    const [res] = await conn.query('UPDATE fault_reports SET created_by_user_id = user_id WHERE created_by_user_id IS NULL AND user_id IS NOT NULL');
    console.log('Updated rows:', res.affectedRows);

    // Optionally drop old column - not performing automatically
    console.log('Backfill complete. Note: user_id column still exists. Remove it manually when ready.');
  } catch (err) {
    console.error('Backfill failed', err.message || err);
    process.exit(2);
  } finally {
    try { await conn.end(); } catch (e) {}
  }
})();
