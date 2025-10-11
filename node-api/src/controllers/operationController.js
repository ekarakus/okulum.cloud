const { Operation, Device, OperationType, Technician } = require('../models/relations');

exports.getAll = async (req, res) => {
  try {
    const { deviceId, school_id } = req.query;
    
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
    if (deviceId) {
      whereCondition.device_id = deviceId;
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
