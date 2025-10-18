/* Safe migration: add publish_start_time and publish_end_time TIME columns if they don't exist */
const mysql = require('mysql2/promise');
const fs = require('fs');
let config = {};
try {
  const txt = fs.readFileSync(require('path').resolve(__dirname, '..', 'env.txt'), 'utf8');
  txt.split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([^=]+)=(.*)$/);
    if (m) config[m[1].trim()] = m[2].trim();
  });
} catch (e) {
  // ignore if not present
}

async function run() {
  // env.txt contains DB config lines like DB_HOST=... etc in this repo; fallback to env vars
  const host = process.env.DB_HOST || (config.DB_HOST && config.DB_HOST.split('=')[1]) || 'localhost';
  const user = process.env.DB_USER || (config.DB_USER && config.DB_USER.split('=')[1]) || 'root';
  const password = process.env.DB_PASSWORD || (config.DB_PASSWORD && config.DB_PASSWORD.split('=')[1]) || '';
  const database = process.env.DB_NAME || (config.DB_NAME && config.DB_NAME.split('=')[1]) || 'okulum';

  const conn = await mysql.createConnection({ host, user, password, database });
  try {
    for (const col of ['publish_start_time', 'publish_end_time']) {
      const [rows] = await conn.execute(`SELECT COUNT(*) as c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'info_nuggets' AND COLUMN_NAME = ?`, [database, col]);
      if (rows[0].c === 0) {
        console.log(`Adding column ${col}`);
        await conn.execute(`ALTER TABLE info_nuggets ADD COLUMN ${col} TIME NULL`);
      } else {
        console.log(`Column ${col} already exists`);
      }
    }
    console.log('Migration complete');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

run();
