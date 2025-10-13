const { sequelize } = require('../models/relations');
const SchoolTimeTable = require('../models/school_time_table');

/** List entries. Optional query params: day_of_week, school_id (if later we associate) */
exports.list = async (req, res) => {
  try {
    const where = {};
    if (req.query.day_of_week) where.day_of_week = parseInt(req.query.day_of_week, 10);
    const items = await SchoolTimeTable.findAll({ where, order: [['day_of_week','ASC'], ['start_time','ASC']] });
    res.json(items);
  } catch (err) {
    console.error('[schoolTimeTable.list] error', err);
    res.status(500).json({ error: 'Failed to list time table entries' });
  }
};

exports.get = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const item = await SchoolTimeTable.findByPk(id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    console.error('[schoolTimeTable.get] error', err);
    res.status(500).json({ error: 'Failed to get entry' });
  }
};

exports.create = async (req, res) => {
  try {
    const allowed = ['period_name','period_type','start_time','duration_minutes','is_block','block_id','day_of_week'];
    const payload = {};
    for (const k of allowed) if (req.body[k] !== undefined) payload[k] = req.body[k];

    // Basic validation
    if (!payload.period_name || !payload.period_type || !payload.start_time || !payload.duration_minutes) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Normalize types
    payload.duration_minutes = parseInt(payload.duration_minutes, 10);
    payload.is_block = payload.is_block === true || payload.is_block === 'true' || payload.is_block === 1 || payload.is_block === '1' ? true : false;

    // If day_of_week is an array, create multiple entries inside a transaction
    if (Array.isArray(payload.day_of_week)) {
      const days = payload.day_of_week.map(d => parseInt(d, 10));
      const created = [];
      await sequelize.transaction(async (t) => {
        // If this is a block and no block_id provided, compute next block id inside the transaction
        let assignedBlockId = payload.block_id;
        if (payload.is_block && (assignedBlockId === undefined || assignedBlockId === null || assignedBlockId === '')) {
          const maxBlock = await SchoolTimeTable.max('block_id', { transaction: t });
          assignedBlockId = (maxBlock || 0) + 1;
        }

        for (const d of days) {
          const p = { ...payload, day_of_week: d };
          if (payload.is_block) p.block_id = assignedBlockId;
          const c = await SchoolTimeTable.create(p, { transaction: t });
          created.push(c);
        }
      });
      return res.status(201).json(created);
    }

    // Single entry create - also ensure block_id assigned if needed
    const created = await sequelize.transaction(async (t) => {
      let assignedBlockId = payload.block_id;
      if (payload.is_block && (assignedBlockId === undefined || assignedBlockId === null || assignedBlockId === '')) {
        const maxBlock = await SchoolTimeTable.max('block_id', { transaction: t });
        assignedBlockId = (maxBlock || 0) + 1;
      }
      if (payload.is_block) payload.block_id = assignedBlockId;
      return await SchoolTimeTable.create(payload, { transaction: t });
    });
    res.status(201).json(created);
  } catch (err) {
    console.error('[schoolTimeTable.create] error', err);
    // surface validation errors
    if (err && err.name === 'SequelizeDatabaseError') return res.status(400).json({ error: err.message });
    res.status(500).json({ error: 'Failed to create entry' });
  }
};

exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const item = await SchoolTimeTable.findByPk(id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    const allowed = ['period_name','period_type','start_time','duration_minutes','is_block','block_id','day_of_week'];
    for (const k of allowed) if (req.body[k] !== undefined) item[k] = req.body[k];
    await item.save();
    res.json(item);
  } catch (err) {
    console.error('[schoolTimeTable.update] error', err);
    res.status(500).json({ error: 'Failed to update entry' });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const item = await SchoolTimeTable.findByPk(id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    await item.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error('[schoolTimeTable.remove] error', err);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
};
