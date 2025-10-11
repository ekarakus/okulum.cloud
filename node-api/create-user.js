const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createUser() {
  try {
    // Generate hash
    const password = '123456';
    const hash = bcrypt.hashSync(password, 10);
    
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('Hash verification:', bcrypt.compareSync(password, hash));
    
    // Connect to database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'okuldb'
    });
    
    // Insert user
    const [result] = await connection.execute(
      'INSERT INTO Users (name, role, email, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
      ['Ergün', 'admin', 'ekarakus@btofis.com', hash]
    );
    
    console.log('User created successfully:', result);
    
    // Verify user
    const [rows] = await connection.execute(
      'SELECT * FROM Users WHERE email = ?',
      ['ekarakus@btofis.com']
    );
    
    console.log('User in database:', rows[0]);
    
    await connection.end();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createUser();