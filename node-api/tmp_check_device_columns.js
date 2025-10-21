require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mysql = require('mysql2/promise');
(async()=>{
  try{
    const c = await mysql.createConnection({ host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASS, database: process.env.DB_NAME });
    const [rows] = await c.query("SHOW COLUMNS FROM devices LIKE 'user_id' OR LIKE 'user_is_employee' OR LIKE 'user'");
    console.log(JSON.stringify(rows, null, 2));
    await c.end();
  }catch(e){ console.error(e); process.exit(1); }
})();
