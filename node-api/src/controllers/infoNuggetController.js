const { InfoNugget, InfoNuggetCategory } = require('../models/relations');
const { Op } = require('sequelize');

// GET /api/info-nuggets
exports.list = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.categoryId) where.category_id = req.query.categoryId;
    if (typeof req.query.is_active !== 'undefined' && req.query.is_active !== '') where.is_active = req.query.is_active === '1' || req.query.is_active === 'true';
    if (req.query.search) {
      const s = req.query.search.trim();
      where[Op.or] = [
        { title: { [Op.like]: `%${s}%` } },
        { text_content: { [Op.like]: `%${s}%` } }
      ];
    }

    // sorting
    const sortBy = req.query.sortBy || 'created_at';
    const order = (req.query.order && req.query.order.toLowerCase() === 'asc') ? 'ASC' : 'DESC';

    // support sorting by joined Category.name if requested
    let orderArray = [[sortBy, order]];
    if (sortBy === 'category') {
      orderArray = [[{ model: InfoNuggetCategory, as: 'Category' }, 'name', order]];
    }

    const { rows, count } = await InfoNugget.findAndCountAll({
      where,
  include: [{ model: InfoNuggetCategory, as: 'Category', attributes: ['id','name','color_hex'] }],
      order: orderArray,
      limit,
      offset
    });

    res.json({ data: rows, total: count, page, limit });
  } catch (err) {
    console.error('Error listing info nuggets:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/info-nuggets/:id
exports.get = async (req, res) => {
  try {
    const id = req.params.id;
  const n = await InfoNugget.findByPk(id, { include: [{ model: InfoNuggetCategory, as: 'Category', attributes: ['id','name','color_hex'] }] });
    if (!n) return res.status(404).json({ message: 'Info nugget not found' });
    res.json(n);
  } catch (err) {
    console.error('Error fetching info nugget:', err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/info-nuggets
exports.create = async (req, res) => {
  try {
    const payload = req.body;
    const n = await InfoNugget.create({
      category_id: payload.category_id,
      is_active: typeof payload.is_active !== 'undefined' ? !!payload.is_active : true,
      title: payload.title || null,
      text_content: payload.text_content || null,
      display_duration_ms: typeof payload.display_duration_ms !== 'undefined' ? payload.display_duration_ms : 10000,
      priority: typeof payload.priority !== 'undefined' ? payload.priority : 1,
      start_date: payload.start_date || null,
      expiration_date: payload.expiration_date || null,
      publish_start_time: payload.publish_start_time || null,
      publish_end_time: payload.publish_end_time || null
    });
    res.status(201).json(n);
  } catch (err) {
    console.error('Error creating info nugget:', err);
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/info-nuggets/:id
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const payload = req.body;
    const n = await InfoNugget.findByPk(id);
    if (!n) return res.status(404).json({ message: 'Info nugget not found' });

    await n.update({
      category_id: typeof payload.category_id !== 'undefined' ? payload.category_id : n.category_id,
      is_active: typeof payload.is_active !== 'undefined' ? !!payload.is_active : n.is_active,
      title: typeof payload.title !== 'undefined' ? payload.title : n.title,
      text_content: typeof payload.text_content !== 'undefined' ? payload.text_content : n.text_content,
      display_duration_ms: typeof payload.display_duration_ms !== 'undefined' ? payload.display_duration_ms : n.display_duration_ms,
      priority: typeof payload.priority !== 'undefined' ? payload.priority : n.priority,
      start_date: typeof payload.start_date !== 'undefined' ? payload.start_date : n.start_date,
      expiration_date: typeof payload.expiration_date !== 'undefined' ? payload.expiration_date : n.expiration_date,
      publish_start_time: typeof payload.publish_start_time !== 'undefined' ? payload.publish_start_time : n.publish_start_time,
      publish_end_time: typeof payload.publish_end_time !== 'undefined' ? payload.publish_end_time : n.publish_end_time,
      updated_at: new Date()
    });

    res.json(n);
  } catch (err) {
    console.error('Error updating info nugget:', err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/info-nuggets/:id
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const n = await InfoNugget.findByPk(id);
    if (!n) return res.status(404).json({ message: 'Info nugget not found' });
    await n.destroy();
    res.json({ message: 'Info nugget deleted' });
  } catch (err) {
    console.error('Error deleting info nugget:', err);
    res.status(500).json({ error: err.message });
  }
};
