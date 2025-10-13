const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config');

async function run() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found at', migrationsDir);
    process.exit(0);
  }

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  if (!files.length) {
    console.log('No .sql migrations to run');
    process.exit(0);
  }

  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    multipleStatements: true
  });

  try {
    // Ensure migrations table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    for (const file of files) {
      const [rows] = await conn.execute('SELECT 1 FROM migrations WHERE filename = ?', [file]);
      if (rows && rows.length) {
        console.log(`${file} already applied, skipping`);
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      console.log('Applying', filePath);
      const sql = fs.readFileSync(filePath, 'utf8');
      try {
        await conn.query(sql);
        await conn.execute('INSERT INTO migrations (filename) VALUES (?)', [file]);
        console.log(`Applied ${file}`);
      } catch (err) {
        console.error(`Failed to apply ${file}:`, err.message || err);
        console.error('Stopping migrations. Resolve the problem and re-run.');
        process.exit(2);
      }
    }

    console.log('All migrations processed');
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error('Migration runner failed:', err);
    try { await conn.end(); } catch (e) {}
    process.exit(3);
  }
}

run();
