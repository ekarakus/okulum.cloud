const { EmployeeType } = require('../models/relations');

exports.list = async (req, res) => {
  try {
    const items = await EmployeeType.findAll({ order: [['name', 'ASC']] });
    res.json(items);
  } catch (err) {
    console.error('EmployeeType list error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.get = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const item = await EmployeeType.findByPk(id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    console.error('EmployeeType get error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const payload = req.body;
    // Validate mutually exclusive flags: at most one may be true
    const flags = ['is_teacher', 'is_principal', 'is_vice_principal'];
    const trueCount = flags.reduce((c, f) => c + (payload[f] ? 1 : 0), 0);
    if (trueCount > 1) return res.status(400).json({ error: 'Only one of is_teacher, is_principal, is_vice_principal may be true' });

    const item = await EmployeeType.create(payload);
    res.json(item);
  } catch (err) {
    console.error('EmployeeType create error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const payload = req.body;
    // Validate mutually exclusive flags
    const flags = ['is_teacher', 'is_principal', 'is_vice_principal'];
    const trueCount = flags.reduce((c, f) => c + (payload[f] ? 1 : 0), 0);
    if (trueCount > 1) return res.status(400).json({ error: 'Only one of is_teacher, is_principal, is_vice_principal may be true' });
    const item = await EmployeeType.findByPk(id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    await item.update(payload);
    res.json(item);
  } catch (err) {
    console.error('EmployeeType update error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const item = await EmployeeType.findByPk(id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    await item.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error('EmployeeType remove error', err);
    res.status(500).json({ error: 'Server error' });
  }
};
