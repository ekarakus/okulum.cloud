const { Location } = require('../models/relations');

exports.getAll = async (req, res) => {
  try {
    // Okul filtresi oluştur
    let whereClause = {};
    
    // Super admin değilse sadece kendi okullarındaki lokasyonları getir
    if (req.userSchools !== null && req.userSchools !== undefined) {
      const schoolIds = req.userSchools.map(us => us.school_id);
      if (schoolIds.length === 0) {
        return res.json([]);
      }
      whereClause.school_id = schoolIds;
    }
    
    // Query parameter'dan school_id gelirse
    if (req.query.school_id) {
      if (req.userSchools !== null && req.userSchools !== undefined && !req.userSchools.some(us => us.school_id == req.query.school_id)) {
        return res.status(403).json({ message: 'Bu okula erişim yetkiniz yok' });
      }
      whereClause.school_id = req.query.school_id;
    }
    
    const locations = await Location.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.create = async (req, res) => {
  const location = await Location.create(req.body);
  res.status(201).json(location);
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const location = await Location.findByPk(id);
  if (!location) return res.status(404).json({ message: 'Lokasyon bulunamadı' });
  await location.update(req.body);
  res.json(location);
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  const location = await Location.findByPk(id);
  if (!location) return res.status(404).json({ message: 'Lokasyon bulunamadı' });
  await location.destroy();
  res.json({ message: 'Silindi' });
};
