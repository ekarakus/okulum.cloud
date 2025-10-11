// Script to remove status column from Features table
// Run this manually if needed: node remove_status_column.js

const mysql = require('mysql2/promise');

async function removeStatusColumn() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deneme123.',
    database: 'okuldb'
  });

  try {
    // Check if status column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'okuldb' 
      AND TABLE_NAME = 'Features' 
      AND COLUMN_NAME = 'status'
    `);

    if (columns.length > 0) {
      console.log('Status column found, removing...');
      
      // Remove status column
      await connection.execute('ALTER TABLE Features DROP COLUMN status');
      
      console.log('Status column successfully removed from Features table');
    } else {
      console.log('Status column not found in Features table');
    }

  } catch (error) {
    console.error('Error removing status column:', error);
  } finally {
    await connection.end();
  }
}

removeStatusColumn();