const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

// Stores single-row global configuration (SMTP, etc.)
const GlobalSetting = sequelize.define('GlobalSetting', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  smtp_host: { type: DataTypes.STRING, allowNull: true },
  smtp_port: { type: DataTypes.INTEGER, allowNull: true },
  smtp_secure: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
  smtp_user: { type: DataTypes.STRING, allowNull: true },
  smtp_password: { type: DataTypes.STRING, allowNull: true },
  from_email: { type: DataTypes.STRING, allowNull: true },
  from_name: { type: DataTypes.STRING, allowNull: true },
  provider: { type: DataTypes.STRING, allowNull: true, comment: 'gmail | custom | other' },
}, {
  tableName: 'global_settings'
});

module.exports = GlobalSetting;
