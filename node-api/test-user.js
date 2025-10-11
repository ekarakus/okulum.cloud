const bcrypt = require('bcryptjs');
const { User } = require('./src/models/relations');
const { sequelize } = require('./src/models/index');

async function createTestUser() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    
    // Test user create
    const hashedPassword = await bcrypt.hash('test123', 10);
    const user = await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: hashedPassword,
      role: 'admin'
    });
    
    console.log('Test user created:', user.email);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestUser();