const { sequelize } = require('../src/models/relations');

async function run() {
  try {
    console.log('Checking students table columns...');
    const db = sequelize.config.database;
    const [cols] = await sequelize.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'students'`, { replacements: [db] });
    const colNames = (cols || []).map(r => (r.COLUMN_NAME || r.column_name || '').toString().toLowerCase());
    const hasGender = colNames.includes('gender');
    const hasSinif = colNames.includes('sinif');
    const hasClassName = colNames.includes('class_name');

    if (!hasClassName) {
      console.log('Adding class_name column...');
      await sequelize.query(`ALTER TABLE students ADD class_name VARCHAR(10) NULL`);
      console.log('Added class_name column.');
      // If sinif exists, copy its values into class_name
      if (hasSinif) {
        console.log('Copying sinif values into class_name...');
        await sequelize.query(`UPDATE students SET class_name = sinif WHERE class_name IS NULL`);
        console.log('Copy complete.');
      }
    } else {
      console.log('class_name column already exists.');
    }

    if (hasGender) {
      console.log('Dropping gender column...');
      await sequelize.query(`ALTER TABLE students DROP COLUMN gender`);
      console.log('Dropped gender column.');
    } else {
      console.log('gender column not present.');
    }

    // Optionally drop old sinif column (if present) now that class_name has been populated
    if (hasSinif) {
      console.log('Dropping old sinif column...');
      await sequelize.query(`ALTER TABLE students DROP COLUMN sinif`);
      console.log('Dropped sinif column.');
    }

    console.log('Migration finished. Please restart your server if running.');
    process.exit(0);
  } catch (err) {
    console.error('Migration error', err);
    process.exit(1);
  }
}

run();
