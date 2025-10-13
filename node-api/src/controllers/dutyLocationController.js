const { DutyLocation } = require('../models/relations');

exports.getAll = async (req, res) => {
  try {
    // TEMP LOGGING: enable detailed query logging for debugging the unknown 'icon' column error.
    // We'll log the SQL that Sequelize emits for this request and the generated 'where' clause.
    let whereClause = {};
    if (req.userSchools !== null && req.userSchools !== undefined) {
      const schoolIds = req.userSchools.map(us => us.school_id);
      if (schoolIds.length === 0) return res.json([]);
      whereClause.school_id = schoolIds;
    }
    if (req.query.school_id) {
      if (req.userSchools !== null && req.userSchools !== undefined && !req.userSchools.some(us => us.school_id == req.query.school_id)) {
        return res.status(403).json({ message: 'Bu okula erişim yetkiniz yok' });
      }
      whereClause.school_id = req.query.school_id;
    }
    // Force logging for this operation so we capture the exact SQL.
  // Order by 'order' (ascending) then by 'name' to provide deterministic listing
  const items = await DutyLocation.findAll({ where: whereClause, order: [['order', 'ASC'], ['name', 'ASC']], logging: (sql) => console.log('[SQL][duty_locations.findAll]', sql) });
    res.json(items);
  } catch (error) {
    console.error('Error fetching duty locations:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const obj = await DutyLocation.create(req.body);
    res.status(201).json(obj);
  } catch (error) {
    console.error('Error creating duty location:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await DutyLocation.findByPk(id);
    if (!item) return res.status(404).json({ message: 'Nöbet yeri bulunamadı' });
    await item.update(req.body);
    res.json(item);
  } catch (error) {
    console.error('Error updating duty location:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await DutyLocation.findByPk(id);
    if (!item) return res.status(404).json({ message: 'Nöbet yeri bulunamadı' });
    await item.destroy();
    res.json({ message: 'Silindi' });
  } catch (error) {
    console.error('Error deleting duty location:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
