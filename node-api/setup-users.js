const bcrypt = require('bcryptjs');
const { User, School, UserSchool } = require('./src/models/relations');
const { sequelize } = require('./src/models/index');

async function createSuperAdminAndSchools() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    
    // Super admin oluştur
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'admin@okul.com',
      password: hashedPassword,
      role: 'super_admin',
      is_active: true
    });
    console.log('Super Admin created:', superAdmin.email);
    
    // Test okulları oluştur
    const school1 = await School.create({
      name: 'Atatürk İlkokulu',
      code: 'ATA001',
      address: 'İstanbul/Kadıköy',
      phone: '0216 123 45 67',
      email: 'info@ataturkilkokulu.edu.tr',
      principal_name: 'Mehmet Özkan',
      status: 'active'
    });
    console.log('School 1 created:', school1.name);
    
    const school2 = await School.create({
      name: 'İstiklal Ortaokulu',
      code: 'IST002',
      address: 'İstanbul/Beyoğlu',
      phone: '0212 987 65 43',
      email: 'info@istiklalortaokulu.edu.tr',
      principal_name: 'Ayşe Kaya',
      status: 'active'
    });
    console.log('School 2 created:', school2.name);
    
    // Normal kullanıcı oluştur ve okullara ata
    const normalUser = await User.create({
      name: 'Teknisyen Ali',
      email: 'ali@okul.com',
      password: hashedPassword,
      role: 'technician',
      is_active: true
    });
    console.log('Normal user created:', normalUser.email);
    
    // Kullanıcıyı okullara ata
    await UserSchool.create({
      user_id: normalUser.id,
      school_id: school1.id,
      role_in_school: 'admin',
      is_primary: true
    });
    
    await UserSchool.create({
      user_id: normalUser.id,
      school_id: school2.id,
      role_in_school: 'technician',
      is_primary: false
    });
    
    console.log('User assigned to schools successfully');
    
    console.log('\n=== LOGIN BİLGİLERİ ===');
    console.log('Super Admin:');
    console.log('  Email: admin@okul.com');
    console.log('  Password: admin123');
    console.log('\nNormal User:');
    console.log('  Email: ali@okul.com');
    console.log('  Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createSuperAdminAndSchools();