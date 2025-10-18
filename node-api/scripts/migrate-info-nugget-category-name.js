const { sequelize } = require('../src/models/index');

async function run() {
  try {
    console.log('Starting migration: add/populate info_nugget_categories.name');

    // 1) Add column if not exists (safe check via information_schema)
    const [[col]] = await sequelize.query(`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'info_nugget_categories' AND COLUMN_NAME = 'name' LIMIT 1;`);
    if (!col) {
      await sequelize.query(`ALTER TABLE info_nugget_categories ADD COLUMN name VARCHAR(100);`);
      console.log('Added name column');
    } else {
      console.log('name column already exists');
    }

    // 2) Populate name from display_name or type_name where null or empty
    await sequelize.query(`UPDATE info_nugget_categories SET name = COALESCE(display_name, type_name, name) WHERE name IS NULL OR name = '';`);
    console.log('Populated name values from display_name/type_name where needed');

    // 3) Check for duplicate names
    const [dups] = await sequelize.query(`SELECT name, COUNT(*) as cnt FROM info_nugget_categories GROUP BY name HAVING COUNT(*) > 1;`);
    if (dups && dups.length > 0) {
      console.error('Duplicate names found. Please resolve duplicates before applying NOT NULL/UNIQUE constraints:');
      console.table(dups);
      process.exit(1);
    }

    // 4) Set NOT NULL (only if all rows have name)
    const [[{cnt}]] = await sequelize.query(`SELECT COUNT(*) as cnt FROM info_nugget_categories WHERE name IS NULL OR name = '';`);
    if (Number(cnt) > 0) {
      console.error('Some rows still have NULL/empty name. Please inspect before continuing.');
      process.exit(1);
    }

    // 5) Alter column to NOT NULL
    await sequelize.query(`ALTER TABLE info_nugget_categories MODIFY COLUMN name VARCHAR(100) NOT NULL;`);
    console.log('Set name column to NOT NULL');

    // 6) Add unique index if not exists
    try {
      await sequelize.query(`ALTER TABLE info_nugget_categories ADD UNIQUE INDEX uq_info_nugget_categories_name (name);`);
      console.log('Added unique index on name');
    } catch (e) {
      console.warn('Could not add unique index on name:', e.message);
    }

      // 7) Drop old columns if they exist (type_name, display_name)
      const [[colType]] = await sequelize.query(`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'info_nugget_categories' AND COLUMN_NAME = 'type_name' LIMIT 1;`);
      if (colType) {
        await sequelize.query(`ALTER TABLE info_nugget_categories DROP COLUMN type_name;`);
        console.log('Dropped type_name column');
      }
      const [[colDisplay]] = await sequelize.query(`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'info_nugget_categories' AND COLUMN_NAME = 'display_name' LIMIT 1;`);
      if (colDisplay) {
        await sequelize.query(`ALTER TABLE info_nugget_categories DROP COLUMN display_name;`);
        console.log('Dropped display_name column');
      }

    console.log('Migration complete');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exit(1);
  }
}

run();
