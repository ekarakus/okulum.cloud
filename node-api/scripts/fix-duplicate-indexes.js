const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { sequelize } = require('../src/models/relations');

async function run() {
  try {
    console.log('Authenticating DB connection...');
    await sequelize.authenticate();
    console.log('DB connection OK');

    const qi = sequelize.getQueryInterface();
    const tables = await qi.showAllTables();

    for (const table of tables) {
      try {
        const rows = await sequelize.query(`SHOW INDEX FROM \`${table}\``, { type: sequelize.QueryTypes.SELECT });
        if (!rows || rows.length === 0) continue;

        // Aggregate rows by Key_name
        const indexes = {};
        for (const r of rows) {
          const key = r.Key_name;
          if (!indexes[key]) indexes[key] = { non_unique: r.Non_unique, columns: [] };
          indexes[key].columns[r.Seq_in_index - 1] = r.Column_name;
        }

        // Build signature -> [indexNames]
        const sigMap = {};
        for (const [keyName, info] of Object.entries(indexes)) {
          // Skip PRIMARY
          if (keyName === 'PRIMARY') continue;
          const cols = info.columns.join(',');
          const sig = `${info.non_unique || 0}::${cols}`;
          if (!sigMap[sig]) sigMap[sig] = [];
          sigMap[sig].push(keyName);
        }

        // For any signature with multiple index names, drop duplicates (keep first)
        for (const [sig, names] of Object.entries(sigMap)) {
          if (names.length <= 1) continue;
          console.log(`Table ${table}: found duplicate indexes for signature ${sig}: ${names.join(', ')}`);
          // Keep the first, drop the rest
          const keep = names[0];
          const drop = names.slice(1);
          for (const idx of drop) {
            try {
              console.log(`Dropping index ${idx} on table ${table}`);
              await sequelize.query(`ALTER TABLE \`${table}\` DROP INDEX \`${idx}\``);
            } catch (dropErr) {
              console.warn(`Failed to drop index ${idx} on ${table}:`, dropErr.message || dropErr);
            }
          }
        }
      } catch (err) {
        console.warn('Skipping table', table, 'due to error:', err.message || err);
      }
    }

    console.log('Duplicate index cleanup complete');
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Fix duplicate indexes error:', err && err.message || err);
    process.exit(1);
  }
}

run();
