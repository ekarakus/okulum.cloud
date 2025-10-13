const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const School = sequelize.define('School', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  name: { 
    type: DataTypes.STRING, 
    allowNull: false,
    comment: 'Okul adı'
  },
  code: { 
    type: DataTypes.STRING(10), 
    unique: true, 
    allowNull: false,
    comment: 'Okul kodu (örn: AKM001)'
  },
  province_id: { type: DataTypes.INTEGER, allowNull: false },
  district_id: { type: DataTypes.INTEGER, allowNull: false },
  school_type: { type: DataTypes.ENUM('ana_okulu','ilk_okul','orta_okul','lise'), allowNull: false, defaultValue: 'ilk_okul' },
  is_double_shift: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  start_time: { type: DataTypes.STRING(5), allowNull: false, defaultValue: '08:00' },
  lesson_duration_minutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 40 },
  break_duration_minutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
  logo_path: { type: DataTypes.STRING, allowNull: true },
  created_at: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  },
  updated_at: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  }
}, {
  tableName: 'schools',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = School;