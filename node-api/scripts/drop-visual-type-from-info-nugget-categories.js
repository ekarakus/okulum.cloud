const { sequelize } = require('../src/models/index');

(async function(){
  try {
    console.log('Checking for visual_type column...');
    const [[col]] = await sequelize.query(`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'info_nugget_categories' AND COLUMN_NAME = 'visual_type' LIMIT 1;`);
    if (col) {
      await sequelize.query(`ALTER TABLE info_nugget_categories DROP COLUMN visual_type;`);
      console.log('Dropped visual_type column');
    } else {
      console.log('visual_type column not present');
    }
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message || err);
    process.exit(1);
  }
})();
