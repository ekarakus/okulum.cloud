const { Permission, User } = require('../models/relations');

// List all permissions (super_admin only)
exports.list = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const rows = await Permission.findAll({ order: [['name', 'ASC']] });
    res.json(rows);
  } catch (err) {
    console.error('Permission list error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.get = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const id = parseInt(req.params.id, 10);
    const item = await Permission.findByPk(id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    console.error('Permission get error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const existing = await Permission.findOne({ where: { name } });
    if (existing) return res.status(409).json({ error: 'Permission already exists' });
    const newItem = await Permission.create({ name, description });
    res.status(201).json(newItem);
  } catch (err) {
    console.error('Permission create error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const id = parseInt(req.params.id, 10);
    const { name, description } = req.body;
    const item = await Permission.findByPk(id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (name) item.name = name;
    item.description = description;
    await item.save();
    res.json(item);
  } catch (err) {
    console.error('Permission update error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const id = parseInt(req.params.id, 10);
    const item = await Permission.findByPk(id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    await item.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error('Permission delete error', err);
    res.status(500).json({ error: 'Server error' });
  }
};
