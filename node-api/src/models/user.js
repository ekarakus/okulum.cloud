const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  role: { 
    type: DataTypes.ENUM('super_admin', 'admin'), 
    defaultValue: 'admin',
    comment: 'super_admin: Sistem yöneticisi, admin: Okul yöneticisi'
  },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  is_active: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: true,
    comment: 'Kullanıcı aktif mi?'
  },
  last_login: { 
    type: DataTypes.DATE,
    comment: 'Son giriş tarihi'
  },
  created_at: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  },
  updated_at: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = User;
