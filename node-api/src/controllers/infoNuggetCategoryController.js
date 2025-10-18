const { InfoNuggetCategory } = require('../models/relations');

exports.list = async (req, res) => {
  try {
    const categories = await InfoNuggetCategory.findAll({ order: [['name','ASC']] });
    res.json(categories);
  } catch (err) {
    console.error('Error listing info nugget categories:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const id = req.params.id;
    const c = await InfoNuggetCategory.findByPk(id);
    if (!c) return res.status(404).json({ message: 'Category not found' });
    res.json(c);
  } catch (err) {
    console.error('Error fetching category:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const payload = req.body;
    const c = await InfoNuggetCategory.create({
      name: payload.name || payload.type_name || payload.display_name,
      color_hex: payload.color_hex || null,
      visual_value: payload.visual_value || ''
    });
    res.status(201).json(c);
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const payload = req.body;
    const c = await InfoNuggetCategory.findByPk(id);
    if (!c) return res.status(404).json({ message: 'Category not found' });
    await c.update({
      name: typeof payload.name !== 'undefined' ? payload.name : (typeof payload.type_name !== 'undefined' ? payload.type_name : c.name),
      color_hex: typeof payload.color_hex !== 'undefined' ? payload.color_hex : c.color_hex,
      visual_value: typeof payload.visual_value !== 'undefined' ? payload.visual_value : c.visual_value,
    });
    res.json(c);
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const c = await InfoNuggetCategory.findByPk(id);
    if (!c) return res.status(404).json({ message: 'Category not found' });
    await c.destroy();
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: err.message });
  }
};
