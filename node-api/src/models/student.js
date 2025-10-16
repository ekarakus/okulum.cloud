const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const Student = sequelize.define('Student', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  student_no: { type: DataTypes.STRING(32), allowNull: false, unique: true, comment: 'Öğrenci numarası' },
  first_name: { type: DataTypes.STRING(100), allowNull: false },
  last_name: { type: DataTypes.STRING(100), allowNull: false },
  class_name: { type: DataTypes.STRING(10), allowNull: true, comment: 'Öğrenci sınıfı (ör. 9A, 10B) - maksimum 10 karakter' },
  birth_date: { type: DataTypes.DATEONLY, allowNull: true },
  school_id: { type: DataTypes.INTEGER, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'students',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Student;
