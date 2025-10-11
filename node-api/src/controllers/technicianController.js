const { Technician } = require('../models/relations');

exports.getAll = async (req, res) => {
  try {
    // Okul filtresi oluştur
    let whereClause = {};

    // Super admin değilse sadece kendi okullarındaki teknisyenleri getir
    if (req.userSchools !== null && req.userSchools !== undefined) {
      const schoolIds = req.userSchools.map(us => us.school_id);
      if (schoolIds.length === 0) {
        return res.json([]);
      }
      whereClause.school_id = schoolIds;
    }

    // Query parameter'dan school_id gelirse
    if (req.query.school_id) {
      if (
        req.userSchools !== null &&
        req.userSchools !== undefined &&
        !req.userSchools.some(us => us.school_id == req.query.school_id)
      ) {
        return res.status(403).json({ message: 'Bu okula erişim yetkiniz yok' });
      }
      whereClause.school_id = req.query.school_id;
    }

    const technicians = await Technician.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });
    res.json(technicians);
  } catch (error) {
    console.error('Error fetching technicians:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const technician = await Technician.findByPk(req.params.id);
    if (!technician) {
      return res.status(404).json({ error: 'Teknisyen bulunamadı' });
    }
    res.json(technician);
  } catch (error) {
    console.error('Error fetching technician:', error);
    res.status(500).json({ error: 'Teknisyen getirilirken hata oluştu' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, email, phone, status, school_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'İsim alanı zorunludur' });
    }
    if (!school_id) {
      return res.status(400).json({ error: 'school_id zorunludur' });
    }

    // Basic email format validation if provided
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz' });
    }

    const technician = await Technician.create({
      name,
      email,
      phone,
      status: status || 'active',
      school_id
    });
    res.status(201).json(technician);
  } catch (error) {
    console.error('Error creating technician:', error);
    res.status(500).json({ error: 'Teknisyen oluşturulurken hata oluştu', details: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, email, phone, status } = req.body;
    const technician = await Technician.findByPk(req.params.id);

    if (!technician) {
      return res.status(404).json({ error: 'Teknisyen bulunamadı' });
    }

    // Basic email format validation if provided
    if (email !== undefined && email !== null && email !== '' && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz' });
    }

    await technician.update({
      name: name || technician.name,
      email: email !== undefined ? email : technician.email,
      phone: phone !== undefined ? phone : technician.phone,
      status: status || technician.status
    });

    res.json(technician);
  } catch (error) {
    console.error('Error updating technician:', error);
    res.status(500).json({ error: 'Teknisyen güncellenirken hata oluştu' });
  }
};

exports.delete = async (req, res) => {
  try {
    const technician = await Technician.findByPk(req.params.id);

    if (!technician) {
      return res.status(404).json({ error: 'Teknisyen bulunamadı' });
    }

    await technician.destroy();
    res.json({ message: 'Silindi' });
  } catch (error) {
    console.error('Error deleting technician:', error);
    res.status(500).json({ error: 'Teknisyen silinirken hata oluştu' });
  }
};