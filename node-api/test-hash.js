const bcrypt = require('bcryptjs');

// Generate a fresh hash for password "123456"
const password = '123456';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Generated Hash:', hash);
console.log('Hash verification:', bcrypt.compareSync(password, hash));

// Test with the exact hash we'll use
const testHash = '$2b$10$Fzs0Udxwp0lwvfB1.JQIcOlQW7DG/jnwbS6lGOjQG1nNjVmkc0adu';
console.log('Test Hash verification:', bcrypt.compareSync(password, testHash));