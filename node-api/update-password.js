const bcrypt = require('bcryptjs');
const mysql = require('mysql2');

async function updatePassword() {
  const password = '12345';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('Generated hash:', hash);
  console.log('Testing hash...');
  const isValid = await bcrypt.compare(password, hash);
  console.log('Hash is valid:', isValid);
  
  // MySQL connection
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASS || '',
    database: 'okul_yonetim'
  });
  
  // Update password
  const query = 'UPDATE users SET password = ? WHERE email = ?';
  connection.execute(query, [hash, 'ekarakus@btofis.com'], (err, results) => {
    if (err) {
      console.error('Error updating password:', err);
    } else {
      console.log('Password updated successfully');
    }
    connection.end();
  });
}

updatePassword();