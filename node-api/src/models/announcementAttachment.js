const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const AnnouncementAttachment = sequelize.define('AnnouncementAttachment', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  announcement_id: { type: DataTypes.INTEGER, allowNull: false },
  filename: { type: DataTypes.STRING, allowNull: false },
  path: { type: DataTypes.STRING, allowNull: false },
  mime_type: { type: DataTypes.STRING, allowNull: true },
  size: { type: DataTypes.INTEGER, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'announcement_attachments',
  timestamps: false
});

module.exports = AnnouncementAttachment;
