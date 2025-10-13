const { Province, District, sequelize } = require('../models/relations');

exports.listProvinces = async (req, res) => {
  try {
    // Use a safe raw query to order by the DB column `ord` explicitly.
    const sql = 'SELECT id, name, ord FROM provinces ORDER BY ord ASC, id ASC';
    console.log('[SQL][provinces.query]', sql);
    const [rows] = await sequelize.query(sql, { logging: (s) => console.log('[SQL][provinces.emitted]', s) });
    // Mirror DB column 'ord' as 'order' in the API response for frontend convenience
    const mapped = rows.map(r => ({ id: r.id, name: r.name, ord: r.ord, order: r.ord }));
    res.json(mapped);
  } catch (err) {
    console.error('Error listing provinces', err);
    res.status(500).json({ error: err.message });
  }
};

exports.listDistricts = async (req, res) => {
  try {
    const provinceId = parseInt(req.params.provinceId, 10);
    if (isNaN(provinceId)) return res.status(400).json({ message: 'Invalid province id' });
    const districts = await District.findAll({ where: { province_id: provinceId }, order: [['name','ASC']] });
    // Deduplicate by normalized name (case-insensitive, trimmed). Keep first occurrence.
    const seen = new Set();
    const unique = [];
    for (const d of districts) {
      let name = String(d.name || '');
      // Normalize Unicode and trim to avoid visually-equal but binary-different strings
      try { name = name.normalize('NFC').trim(); } catch (e) { name = name.trim(); }
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        // If sequelize instance, convert to plain object for JSON
        const obj = typeof d.toJSON === 'function' ? d.toJSON() : d;
        // ensure name uses normalized value
        obj.name = name;
        unique.push(obj);
      }
      else {
        console.log(`[DUPLICATE][districts] skipping id=${d.id} name="${name}" key="${key}"`);
      }
    }
    res.json(unique);
  } catch (err) {
    console.error('Error listing districts', err);
    res.status(500).json({ error: err.message });
  }
};
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

exports.update = async (req, res) => {// debug-only: shows raw response if JSON parse fails
  try {
    const { id } = req.params;
    const location = await Location.findByPk(id);
    if (!location) return res.status(404).json({ message: 'Lokasyon bulunamadı' });
    await location.update(req.body);
    res.json(location);
  } catch (err) {
    console.error('Error updating location', err);
    res.status(500).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  const location = await Location.findByPk(id);
  if (!location) return res.status(404).json({ message: 'Lokasyon bulunamadı' });
  await location.destroy();
  res.json({ message: 'Silindi' });
};
