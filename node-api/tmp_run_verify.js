(async function(){
  try{
    const mysql = require('mysql2/promise');
    const config = require('./config');
    const http = require('http');

    const conn = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database
    });

    const [migs] = await conn.query('SELECT filename, applied_at FROM migrations ORDER BY applied_at DESC LIMIT 10');
    console.log('recent migrations:', migs);

    const [cols] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'devices'
       AND COLUMN_NAME IN ('user','user_id','user_is_employee')`,
      [config.db.database]
    );
    console.log('device columns:', cols.map(c => c.COLUMN_NAME));

    await conn.end();

    // Try to access the API root to see if it's up using built-in http
    try {
      await new Promise((resolve, reject) => {
        const req = http.request({ hostname: '127.0.0.1', port: config.port, path: '/', method: 'GET', timeout: 2000 }, res => {
          console.log('api root status', res.statusCode);
          res.on('data', () => {});
          res.on('end', () => resolve());
        });
        req.on('error', e => {
          reject(e);
        });
        req.on('timeout', () => { req.destroy(new Error('timeout')); });
        req.end();
      });
    } catch (e) {
      console.log('api root not reachable:', e.message);
    }
  } catch(err){
    console.error('verify error:', err.message || err);
    process.exit(1);
  }
})();
