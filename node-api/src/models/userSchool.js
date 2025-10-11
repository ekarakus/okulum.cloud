const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const UserSchool = sequelize.define('UserSchool', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  user_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  school_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: {
      model: 'schools',
      key: 'id'
    }
  },
  is_primary: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: false,
    comment: 'Kullanıcının ana okulu mu?'
  },
  assigned_at: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  }
}, {
  tableName: 'user_schools',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'school_id']
    }
  ]
});

module.exports = UserSchool;