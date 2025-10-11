// Safe script to ensure a lowercase 'features' table exists.
// If an uppercase 'Features' table exists, it will copy data into 'features' and drop the old table.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
// load local config from node-api/config.js
const config = require('../config');

async function run() {
  const conn = await mysql.createConnection({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    port: config.db.port || 3306,
  });

  try {
  console.log('Checking for feature tables...');
  // Use information_schema to detect exact names
    const [found] = await conn.query(
      `SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = ? AND (TABLE_NAME = 'features' OR TABLE_NAME = 'Features')`,
      [config.db.database]
    );

    const names = found.map(r => r.TABLE_NAME);
    const hasLower = names.includes('features');
    const hasUpper = names.includes('Features');

    if (hasLower) {
      console.log("Lowercase 'features' table already exists. Nothing to do.");
      return;
    }

    if (!hasUpper) {
      console.log("No 'features' table found. Creating 'features' table.");
      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`features\` (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          sort_order INT NOT NULL DEFAULT 0
        ) ENGINE=InnoDB;
      `);
      console.log("Created 'features' table.");
      return;
    }

    // If we reached here, only 'Features' exists. Migrate data.
    console.log("Found legacy 'Features' table — migrating to 'features'.");

    // Create lowercase table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`features\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        sort_order INT NOT NULL DEFAULT 0
      ) ENGINE=InnoDB;
    `);

    // Copy data (if any), using INSERT IGNORE to avoid duplicate unique key errors
    const [copyResult] = await conn.query(
      `INSERT IGNORE INTO \`features\` (id, name, description, sort_order) SELECT id, name, description, sort_order FROM \`Features\`;`
    );
    console.log(`Copied ${copyResult.affectedRows} rows from 'Features' to 'features'.`);

    // Optional: drop old table
    console.log("Dropping legacy 'Features' table...");
    await conn.query('DROP TABLE IF EXISTS `Features`;');
    console.log("Dropped legacy table. Migration complete.");
  } finally {
    await conn.end();
  }
}

run().catch(err => {
  console.error('Error normalizing feature table:', err && err.message || err);
  process.exit(1);
});
