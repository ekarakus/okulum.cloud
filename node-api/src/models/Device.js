const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const Device = sequelize.define('Device', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  identity_no: { type: DataTypes.STRING, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  serial_no: { type: DataTypes.STRING },
  user: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('active', 'inactive', 'maintenance'), defaultValue: 'active' },
  location_id: { type: DataTypes.INTEGER, allowNull: false },
  device_type_id: { type: DataTypes.INTEGER, allowNull: false },
  school_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    comment: 'Cihazın ait olduğu okul',
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
  tableName: 'devices',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Device;
