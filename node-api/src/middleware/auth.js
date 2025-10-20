const jwt = require('jsonwebtoken');
const { User, UserSchool } = require('../models/relations');

// JWT token doğrulama
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token bulunamadı' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email', 'role', 'is_active']
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı veya pasif' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(403).json({ message: 'Geçersiz token' });
  }
};

// Super admin kontrolü
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Bu işlem için süper admin yetkisi gerekli' });
  }
  next();
};

// Admin veya super admin kontrolü
const requireAdmin = (req, res, next) => {
  if (!['super_admin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Bu işlem için admin yetkisi gerekli' });
  }
  next();
};

// Admin veya süper admin kontrolü
const requireAdminOrSuperAdmin = (req, res, next) => {
  if (!['super_admin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Bu işlem için admin veya süper admin yetkisi gerekli' });
  }
  next();
};

// Allow owner (requesting user == :id) or admin/super_admin
const requireOwnerOrAdmin = (req, res, next) => {
  const paramId = req.params.id ? parseInt(req.params.id, 10) : null;
  if (!isNaN(paramId) && req.user && req.user.id === paramId) {
    return next();
  }
  if (['super_admin', 'admin'].includes(req.user.role)) return next();
  return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
};

// Okul erişim kontrolü - kullanıcının belirtilen okula erişimi var mı?
const checkSchoolAccess = async (req, res, next) => {
  try {
    // Super admin her okula erişebilir
    if (req.user.role === 'super_admin') {
      return next();
    }

  // Accept both camelCase and snake_case param names (routes may use :id, :schoolId or :school_id)
  const schoolId = req.params.schoolId || req.params.school_id || req.params.id || req.body.school_id || req.query.school_id;
    
    if (!schoolId) {
      return res.status(400).json({ message: 'Okul ID gerekli' });
    }

    // Kullanıcının bu okula erişimi var mı kontrol et
    const userSchool = await UserSchool.findOne({
      where: { 
        user_id: req.user.id, 
        school_id: schoolId 
      }
    });

    if (!userSchool) {
      return res.status(403).json({ message: 'Bu okula erişim yetkiniz yok' });
    }

    req.userSchool = userSchool;
    next();
  } catch (err) {
    console.error('School access check error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Kullanıcının okul listesini req'e ekle
const addUserSchools = async (req, res, next) => {
  try {
    if (req.user.role === 'super_admin') {
      // Super admin tüm okullara erişebilir
      req.userSchools = null; // null = tüm okullara erişim
      return next();
    }

    const userSchools = await UserSchool.findAll({
      where: { user_id: req.user.id },
      attributes: ['school_id', 'is_primary']
    });

    req.userSchools = userSchools.map(us => ({
      school_id: us.school_id,
      is_primary: us.is_primary
    }));

    next();
  } catch (err) {
    console.error('Add user schools error:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  authenticateToken,
  requireSuperAdmin,
  requireAdmin,
  requireAdminOrSuperAdmin,
  requireOwnerOrAdmin,
  checkSchoolAccess,
  addUserSchools
};

