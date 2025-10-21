require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mysql = require('mysql2/promise');
(async()=>{ try{ const c = await mysql.createConnection({ host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASS, database: process.env.DB_NAME });
  const sql = "SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'devices' AND COLUMN_NAME IN ('user','user_id','user_is_employee')";
  const [rows] = await c.query(sql, [process.env.DB_NAME]);
  console.log(JSON.stringify(rows, null, 2));
  await c.end(); }catch(e){ console.error(e); process.exit(1);} })();
