const { School, User, UserSchool, Device, Location, Technician, Operation } = require('../models/relations');

// Tüm okulları listele
exports.getAllSchools = async (req, res) => {
  try {
    const schools = await School.findAll({
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'name', 'email', 'role'],
          through: { attributes: ['is_primary'] }
        }
      ],
      order: [['name', 'ASC']]
    });

    // Her okul için istatistikleri hesapla
    const schoolsWithStats = await Promise.all(schools.map(async (school) => {
      const userCount = await UserSchool.count({ where: { school_id: school.id } });
      const deviceCount = await Device.count({ where: { school_id: school.id } });
      
      return {
        ...school.toJSON(),
        userCount,
        deviceCount
      };
    }));

    res.json(schoolsWithStats);
  } catch (err) {
    console.error('Error fetching schools:', err);
    res.status(500).json({ error: err.message });
  }
};

// Tek okul getir
exports.getSchoolById = async (req, res) => {
  try {
    const { id } = req.params;
    const school = await School.findByPk(id, {
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'name', 'email', 'role'],
          through: { attributes: ['is_primary'] }
        },
        {
          model: Device,
          as: 'Devices',
          attributes: ['id', 'name']
        },
        {
          model: Location,
          as: 'Locations',
          attributes: ['id', 'name']
        },
        {
          model: Technician,
          as: 'Technicians',
          attributes: ['id', 'name']
        }
      ]
    });
    
    if (!school) {
      return res.status(404).json({ message: 'Okul bulunamadı' });
    }
    
    res.json(school);
  } catch (err) {
    console.error('Error fetching school:', err);
    res.status(500).json({ error: err.message });
  }
};

// Yeni okul oluştur (sadece super_admin)
exports.createSchool = async (req, res) => {
  try {
    const { name, code, province_id, district_id, school_type, is_double_shift, start_time, lesson_duration_minutes, break_duration_minutes, logo_path, lunch_start_time } = req.body;
    console.log('[createSchool] payload:', {
      name, code, province_id, district_id, school_type, is_double_shift, start_time, lesson_duration_minutes, break_duration_minutes, logo_path, lunch_start_time
    });

    // Basic validation
    if (!name || !code) return res.status(400).json({ message: 'name and code are required' });
    if (!province_id || !district_id) return res.status(400).json({ message: 'province_id and district_id are required' });
    if (!school_type) return res.status(400).json({ message: 'school_type is required' });

    // Validate lunch_start_time format when provided
    if (typeof lunch_start_time !== 'undefined' && lunch_start_time !== null) {
      if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(lunch_start_time)) {
        return res.status(400).json({ message: 'lunch_start_time must be in HH:mm format' });
      }
    }

    const existingSchool = await School.findOne({ where: { code } });
    if (existingSchool) return res.status(400).json({ message: 'Bu okul kodu zaten kullanımda' });

    const school = await School.create({
      name,
      code,
      province_id,
      district_id,
      school_type,
      is_double_shift: !!is_double_shift,
      start_time: start_time || '08:00',
      lesson_duration_minutes: parseInt(lesson_duration_minutes || 40,10),
      break_duration_minutes: parseInt(break_duration_minutes || 10,10),
      // Only store lunch_start_time when the school is double shift; otherwise null
      lunch_start_time: !!is_double_shift ? (lunch_start_time || null) : null,
      logo_path: logo_path || null
    });

    res.status(201).json(school);
  } catch (err) {
    console.error('Error creating school:', err);
    res.status(500).json({ error: err.message });
  }
};

// Okul güncelle (sadece super_admin)
exports.updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, province_id, district_id, school_type, is_double_shift, start_time, lesson_duration_minutes, break_duration_minutes, logo_path, lunch_start_time } = req.body;
    console.log('[updateSchool] id=', id, 'payload=', {
      name, code, province_id, district_id, school_type, is_double_shift, start_time, lesson_duration_minutes, break_duration_minutes, logo_path, lunch_start_time
    });

    const school = await School.findByPk(id);
    if (!school) return res.status(404).json({ message: 'Okul bulunamadı' });

    if (code && code !== school.code) {
      const existingSchool = await School.findOne({ where: { code } });
      if (existingSchool) return res.status(400).json({ message: 'Bu okul kodu zaten kullanımda' });
    }

    const newIsDouble = (typeof is_double_shift !== 'undefined') ? !!is_double_shift : school.is_double_shift;

    // Validate lunch_start_time format when provided
    if (typeof lunch_start_time !== 'undefined' && lunch_start_time !== null) {
      if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(lunch_start_time)) {
        return res.status(400).json({ message: 'lunch_start_time must be in HH:mm format' });
      }
    }

    await school.update({
      name: name ?? school.name,
      code: code ?? school.code,
      province_id: province_id ?? school.province_id,
      district_id: district_id ?? school.district_id,
      school_type: school_type ?? school.school_type,
      is_double_shift: newIsDouble,
      start_time: start_time ?? school.start_time,
      lesson_duration_minutes: typeof lesson_duration_minutes !== 'undefined' ? parseInt(lesson_duration_minutes,10) : school.lesson_duration_minutes,
      break_duration_minutes: typeof break_duration_minutes !== 'undefined' ? parseInt(break_duration_minutes,10) : school.break_duration_minutes,
      // If the school is not double-shift, ensure lunch_start_time is null in DB
      lunch_start_time: newIsDouble ? (typeof lunch_start_time !== 'undefined' ? lunch_start_time : school.lunch_start_time) : null,
      logo_path: typeof logo_path !== 'undefined' ? logo_path : school.logo_path
    });

    console.log('[updateSchool] updated:', school.toJSON());
    res.json(school);
  } catch (err) {
    console.error('Error updating school:', err);
    res.status(500).json({ error: err.message });
  }
};

// Okul sil (sadece super_admin)
exports.deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Okulun cihazları var mı kontrol et
    const deviceCount = await Device.count({ where: { school_id: id } });
    if (deviceCount > 0) {
      return res.status(400).json({ 
        message: 'Bu okula ait cihazlar bulunduğu için silinemez. Önce cihazları başka okula transfer edin.' 
      });
    }
    
    const school = await School.findByPk(id);
    if (!school) {
      return res.status(404).json({ message: 'Okul bulunamadı' });
    }
    
    await school.destroy();
    res.json({ message: 'Okul başarıyla silindi' });
  } catch (err) {
    console.error('Error deleting school:', err);
    res.status(500).json({ error: err.message });
  }
};

// Kullanıcıya okul ata (sadece super_admin)
exports.assignUserToSchool = async (req, res) => {
  try {
  const { userId, schoolId, isPrimary } = req.body;
    
    // Kullanıcı ve okul var mı kontrol et
    const user = await User.findByPk(userId);
    const school = await School.findByPk(schoolId);
    
    if (!user || !school) {
      return res.status(404).json({ message: 'Kullanıcı veya okul bulunamadı' });
    }
    
    // Zaten atanmış mı kontrol et
    const existingAssignment = await UserSchool.findOne({
      where: { user_id: userId, school_id: schoolId }
    });
    
    if (existingAssignment) {
      return res.status(400).json({ message: 'Kullanıcı zaten bu okula atanmış' });
    }
    
    // Eğer ana okul olarak atanıyorsa, diğer ana okul atamasını kaldır
    if (isPrimary) {
      await UserSchool.update(
        { is_primary: false },
        { where: { user_id: userId } }
      );
    }
    
    const userSchool = await UserSchool.create({
      user_id: userId,
      school_id: schoolId,
      is_primary: isPrimary || false
    });
    
    res.status(201).json(userSchool);
  } catch (err) {
    console.error('Error assigning user to school:', err);
    res.status(500).json({ error: err.message });
  }
};

// Kullanıcının okul atamasını kaldır (sadece super_admin)
exports.removeUserFromSchool = async (req, res) => {
  try {
    const { userId, schoolId } = req.body;
    
    const userSchool = await UserSchool.findOne({
      where: { user_id: userId, school_id: schoolId }
    });
    
    if (!userSchool) {
      return res.status(404).json({ message: 'Kullanıcı okul ataması bulunamadı' });
    }
    
    await userSchool.destroy();
    res.json({ message: 'Kullanıcı okul ataması kaldırıldı' });
  } catch (err) {
    console.error('Error removing user from school:', err);
    res.status(500).json({ error: err.message });
  }
};

// Kullanıcının okullarını getir
exports.getUserSchools = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userSchools = await UserSchool.findAll({
      where: { user_id: userId },
      include: [
        {
          model: School,
          as: 'School',
          attributes: ['id', 'name', 'code', 'address', 'phone', 'email', 'principal_name', 'status']
        }
      ],
      order: [['is_primary', 'DESC'], ['assigned_at', 'ASC']]
    });
    
    res.json(userSchools);
  } catch (err) {
    console.error('Error fetching user schools:', err);
    res.status(500).json({ error: err.message });
  }
};

// Okul istatistikleri
exports.getSchoolStats = async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    const [deviceCount, locationCount, technicianCount, operationCount] = await Promise.all([
      Device.count({ where: { school_id: schoolId } }),
      Location.count({ where: { school_id: schoolId } }),
      Technician.count({ where: { school_id: schoolId } }),
      Operation.count({ where: { school_id: schoolId } })
    ]);
    
    const recentOperations = await Operation.findAll({
      where: { school_id: schoolId },
      include: [
        { model: Device, as: 'Device', attributes: ['name'] },
        { model: Technician, as: 'Technician', attributes: ['name'] }
      ],
      order: [['date', 'DESC']],
      limit: 5
    });
    
    res.json({
      deviceCount,
      locationCount,
      technicianCount,
      operationCount,
      recentOperations
    });
  } catch (err) {
    console.error('Error fetching school stats:', err);
    res.status(500).json({ error: err.message });
  }
};

// Public: get school by code (no auth) - returns minimal school info
exports.getSchoolByCode = async (req, res) => {
  try {
    const { code } = req.params;
    if (!code) return res.status(400).json({ message: 'code is required' });

    const school = await School.findOne({
      where: { code },
      attributes: ['id', 'name', 'code', 'logo_path', 'province_id', 'district_id', 'start_time', 'lesson_duration_minutes', 'break_duration_minutes', 'is_double_shift']
    });

    if (!school) return res.status(404).json({ message: 'Okul bulunamadı' });

    res.json(school);
  } catch (err) {
    console.error('Error fetching school by code:', err);
    res.status(500).json({ error: err.message });
  }
};