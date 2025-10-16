const { Student, School } = require('../models/relations');

exports.listBySchool = async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId, 10);
    if (isNaN(schoolId)) return res.status(400).json({ error: 'Invalid school id' });
    const rows = await Student.findAll({ where: { school_id: schoolId }, order: [['student_no','ASC']] });
    res.json(rows);
  } catch (err) {
    console.error('Student list error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.get = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const row = await Student.findByPk(id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    console.error('Student get error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const payload = req.body;
    const created = await Student.create(payload);
    res.json(created);
  } catch (err) {
    console.error('Student create error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const payload = req.body;
    const row = await Student.findByPk(id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    await row.update(payload);
    res.json(row);
  } catch (err) {
    console.error('Student update error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const row = await Student.findByPk(id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    await row.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error('Student remove error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.bulkDelete = async (req, res) => {
  try {
    const ids = req.body && Array.isArray(req.body.ids) ? req.body.ids.map(id => parseInt(id, 10)).filter(Boolean) : [];
    if (!ids.length) return res.status(400).json({ error: 'No ids provided' });
    const { sequelize } = require('../models/relations');
    await sequelize.transaction(async (t) => {
      await Student.destroy({ where: { id: ids }, transaction: t });
    });
    res.json({ success: true, deleted: ids.length });
  } catch (err) {
    console.error('Student bulk delete error', err);
    res.status(500).json({ error: 'Server error' });
  }
};
