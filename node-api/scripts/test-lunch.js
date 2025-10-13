const { sequelize } = require('../src/models/index');
const { School } = require('../src/models/relations');

async function runTest() {
  await sequelize.authenticate();
  console.log('DB connected for test');

  const ts = Date.now().toString();
  const code = ('TL' + ts.slice(-6)).toUpperCase(); // short code within 10 chars
  console.log('Creating test school with code', code);

  const school = await School.create({
    name: 'Test School Lunch',
    code,
    province_id: 34,
    district_id: 1,
    school_type: 'ilk_okul',
    is_double_shift: true,
    start_time: '08:00',
    lunch_start_time: '12:30'
  });

  console.log('Created:', { id: school.id, lunch_start_time: school.lunch_start_time, is_double_shift: school.is_double_shift });

  // Simulate update: switch to single shift -> lunch_start_time should be set to null by controller logic
  const newIsDouble = false;
  await school.update({
    is_double_shift: newIsDouble,
    lunch_start_time: newIsDouble ? '13:00' : null
  });
  await school.reload();
  console.log('After switching to single shift:', { id: school.id, lunch_start_time: school.lunch_start_time, is_double_shift: school.is_double_shift });

  // Switch back to double and set lunch time
  const backToDouble = true;
  await school.update({
    is_double_shift: backToDouble,
    lunch_start_time: backToDouble ? '12:45' : null
  });
  await school.reload();
  console.log('After switching back to double:', { id: school.id, lunch_start_time: school.lunch_start_time, is_double_shift: school.is_double_shift });

  // Cleanup: delete test school
  await school.destroy();
  console.log('Test school deleted');

  await sequelize.close();
}

runTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
