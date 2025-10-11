// Script to remove value column from device_features table
// Run this manually if needed: node remove_value_column.js

const mysql = require('mysql2/promise');

async function removeValueColumn() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deneme123.',
    database: 'okuldb'
  });

  try {
    // Check if value column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'okuldb' 
      AND TABLE_NAME = 'device_features' 
      AND COLUMN_NAME = 'value'
    `);

    if (columns.length > 0) {
      console.log('Value column found, removing...');
      
      // Remove value column
      await connection.execute('ALTER TABLE device_features DROP COLUMN value');
      
      console.log('Value column successfully removed from device_features table');
    } else {
      console.log('Value column not found in device_features table');
    }

  } catch (error) {
    console.error('Error removing value column:', error);
  } finally {
    await connection.end();
  }
}

removeValueColumn();