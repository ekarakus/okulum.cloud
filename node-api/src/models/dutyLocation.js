const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const DutyLocation = sequelize.define('DutyLocation', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING },
  order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, comment: 'Sıralama numarası (daha küçük olan üstte gösterilir)' },
  school_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Nöbet yerinin ait olduğu okul',
    references: {
      model: 'schools',
      key: 'id'
    }
  },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'duty_locations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = DutyLocation;
