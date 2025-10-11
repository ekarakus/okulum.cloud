const bcrypt = require('bcryptjs');

async function testPassword() {
  const password = '12345';
  
  console.log('Creating hash for password:', password);
  
  // Yeni hash oluşturalım
  const newHash = await bcrypt.hash(password, 10);
  console.log('New hash for', password, ':', newHash);
  
  // Test edelim
  const isValid = await bcrypt.compare(password, newHash);
  console.log('Is valid:', isValid);
  
  // SQL için escape edilmiş versiyonu
  const escapedHash = newHash.replace(/\$/g, '\\$');
  console.log('Escaped hash for SQL:', escapedHash);
}

testPassword();