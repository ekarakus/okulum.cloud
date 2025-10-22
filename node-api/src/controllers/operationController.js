const { Operation, Device, OperationType, Technician } = require('../models/relations');

exports.getAll = async (req, res) => {
  try {
    // Accept both camelCase and snake_case query params for compatibility
    const { deviceId, device_id, operationTypeId, operation_type_id, supportId, support_id, school_id } = req.query;
    
    // Include'da Device'ı zorunlu yap ve okul filtresi ekle
    let includeClause = [
      { 
        model: Device, 
        as: 'Device',
        required: true // İçeride join yapıyoruz çünkü cihazın okul bilgisine ihtiyacımız var
      },
      { model: OperationType, as: 'OperationType' },
      { model: Technician, as: 'Technician' }
    ];
    
    // Where koşulunu oluştur
    const whereCondition = {};
    // device filter (accept deviceId or device_id)
    const deviceFilter = deviceId || device_id;
    if (deviceFilter) {
      whereCondition.device_id = deviceFilter;
    }
    // operation type filter
    const opTypeFilter = operationTypeId || operation_type_id;
    if (opTypeFilter) {
      whereCondition.operation_type_id = opTypeFilter;
    }
    // support (fault) filter
    const supportFilter = supportId || support_id;
    if (supportFilter) {
      whereCondition.support_id = supportFilter;
    }
    
    // Okul filtresi oluştur
    let deviceWhereClause = {};
    
    // Super admin değilse sadece kendi okullarındaki verileri getir
    if (req.userSchools !== null && req.userSchools !== undefined) {
      const schoolIds = req.userSchools.map(us => us.school_id);
      if (schoolIds.length === 0) {
        return res.json([]);
      }
      deviceWhereClause.school_id = schoolIds;
    }
    
    // Query parameter'dan school_id gelirse
    if (school_id) {
      if (req.userSchools !== null && req.userSchools !== undefined && !req.userSchools.some(us => us.school_id == school_id)) {
        return res.status(403).json({ message: 'Bu okula erişim yetkiniz yok' });
      }
      deviceWhereClause.school_id = school_id;
    }
    
    // Device include'una where koşulu ekle
    includeClause[0].where = deviceWhereClause;
    
    const operations = await Operation.findAll({
      where: whereCondition,
      include: includeClause,
      order: [['date', 'DESC']] // En yeni en üstte
    });
    res.json(operations);
  } catch (error) {
    console.error('Error fetching operations:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getRecent = async (req, res) => {
  try {
    // Okul filtresi için include'da Device ekleyeceğiz, ayrıca tür ve teknisyeni çekelim
    let includeClause = [
      { 
        model: Device, 
        as: 'Device',
        required: true // İçeride join yapıyoruz çünkü cihazın okul bilgisine ihtiyacımız var
      },
      { model: OperationType, as: 'OperationType', required: false },
      { model: Technician, as: 'Technician', required: false }
    ];
    
    // Okul filtresi oluştur
    let whereClause = {};
    
    // Super admin değilse sadece kendi okullarındaki verileri getir
    if (req.userSchools !== null && req.userSchools !== undefined) {
      const schoolIds = req.userSchools.map(us => us.school_id);
      if (schoolIds.length === 0) {
        return res.json([]);
      }
      // Device'ın school_id'si kontrol edilecek
      includeClause[0].where = { school_id: schoolIds };
    }
    
    // Query parameter'dan school_id gelirse
    if (req.query.school_id) {
      if (req.userSchools !== null && req.userSchools !== undefined && !req.userSchools.some(us => us.school_id == req.query.school_id)) {
        return res.status(403).json({ message: 'Bu okula erişim yetkiniz yok' });
      }
      includeClause[0].where = { school_id: req.query.school_id };
    }

    const operations = await Operation.findAll({
      where: whereClause,
      include: includeClause,
      order: [['created_at', 'DESC']],
      limit: 4
    });

    // DB verilerinden okunmuş gerçek response (placeholder yok)
    const response = operations.map(operation => ({
      id: operation.id,
      operation_type_name: operation.OperationType?.name ?? null,
      device_name: operation.Device?.name ?? null,
      device_identity: operation.Device?.identity_no ?? null,
      technician_name: operation.Technician?.name ?? null,
      date: operation.date ?? operation.created_at ?? null,
      is_completed: !!operation.is_completed
    }));

    res.json(response);
  } catch (error) {
    console.error('Error in getRecent operations:', error);
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message,
      stack: error.stack 
    });
  }
};

exports.create = async (req, res) => {
  try {
    // Açıklama boş string ise null yap
    if (req.body.description === '' || req.body.description === undefined) {
      req.body.description = null;
    }
    
    const operation = await Operation.create({ 
      ...req.body, 
      date: req.body.date || new Date() 
    });
    res.status(201).json(operation);
  } catch (error) {
    console.error('Error creating operation:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    // Açıklama boş string ise null yap
    if (req.body.description === '' || req.body.description === undefined) {
      req.body.description = null;
    }
    
    const { id } = req.params;
    const operation = await Operation.findByPk(id);
    if (!operation) return res.status(404).json({ message: 'İşlem bulunamadı' });
    await operation.update(req.body);
    res.json(operation);
  } catch (error) {
    console.error('Error updating operation:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const operation = await Operation.findByPk(id);
    if (!operation) return res.status(404).json({ message: 'İşlem bulunamadı' });
    await operation.destroy();
    res.json({ message: 'Silindi' });
  } catch (error) {
    console.error('Error deleting operation:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/operations/counts
// body: { support_ids: [1,2,3] }
exports.countBySupportIds = async (req, res) => {
  try {
    const { support_ids } = req.body;
    if (!Array.isArray(support_ids) || support_ids.length === 0) return res.json({ counts: {} });

    // Use raw query to aggregate counts grouped by support_id for performance
    const placeholders = support_ids.map(() => '?').join(',');
    let sql = `SELECT support_id, COUNT(*) as cnt FROM operations WHERE support_id IN (${placeholders})`;
    const replacements = [...support_ids];

    // If the request is limited to specific schools (not super-admin), restrict counts to those schools
    if (req.userSchools !== null && req.userSchools !== undefined) {
      const schoolIds = req.userSchools.map(us => us.school_id).filter(Boolean);
      if (schoolIds.length === 0) return res.json({ counts: {} });
      const schoolPlaceholders = schoolIds.map(() => '?').join(',');
      sql += ` AND school_id IN (${schoolPlaceholders})`;
      replacements.push(...schoolIds);
    }

  sql += ' GROUP BY support_id';
  // When using QueryTypes.SELECT sequelize.query returns the result array directly
  const results = await Operation.sequelize.query(sql, { replacements, type: Operation.sequelize.QueryTypes.SELECT });

  const counts = {};
  for (const row of (results || [])) counts[row.support_id] = Number(row.cnt);
    // ensure zeros for missing ones
    for (const id of support_ids) if (!counts[id]) counts[id] = 0;

    res.json({ counts });
  } catch (error) {
    console.error('Error in countBySupportIds:', error);
    res.status(500).json({ error: error.message });
  }
};
