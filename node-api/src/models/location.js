const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const Location = sequelize.define('Location', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING },
  room_number: { type: DataTypes.STRING },
  school_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    comment: 'Lokasyonun ait olduğu okul',
    references: {
      model: 'schools',
      key: 'id'
    }
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
  tableName: 'locations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Location;
