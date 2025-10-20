const mysql = require('mysql2/promise');
const config = require('../node-api/config');

(async function(){
  try {
    const conn = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database
    });

    const [migs] = await conn.query("SELECT filename, applied_at FROM migrations ORDER BY applied_at DESC LIMIT 5");
    console.log('recent migrations:', migs);

    const [cols] = await conn.query("SHOW COLUMNS FROM devices LIKE 'user_id' OR LIKE 'user_is_employee' OR LIKE 'user'");
    console.log('device columns:', cols);

    await conn.end();
  } catch (err) {
    console.error('verify error:', err.message || err);
    process.exit(1);
  }
})();
