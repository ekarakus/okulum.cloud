const { EmailLog } = require('../models/relations');

exports.emailLogs = async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20')));
    const logs = await EmailLog.findAll({ limit, order: [['created_at', 'DESC']] });
    res.json(logs);
  } catch (err) {
    console.error('Failed to fetch email logs:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = exports;
