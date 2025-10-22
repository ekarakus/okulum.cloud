const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const EmailLog = sequelize.define('EmailLog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  to: { type: DataTypes.STRING, allowNull: false },
  subject: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: false }, // 'sent' | 'failed'
  error: { type: DataTypes.TEXT, allowNull: true },
  meta: { type: DataTypes.JSON, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'email_logs',
  timestamps: false
});

module.exports = EmailLog;
