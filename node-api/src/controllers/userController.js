const bcrypt = require('bcryptjs');
const { sequelize } = require('../models');
const { User, School, UserSchool } = require('../models/relations');

// Tüm kullanıcıları listele (sadece super_admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'is_active', 'last_login', 'created_at'],
      include: [
        {
          model: School,
          as: 'schools',
          attributes: ['id', 'name', 'code'],
          through: { 
            attributes: ['id','is_primary', 'assigned_at']
          }
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: err.message });
  }
};

// Tek kullanıcı getir (sadece super_admin)
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'role', 'is_active', 'last_login', 'created_at'],
      include: [
        {
          model: School,
          as: 'schools',
          attributes: ['id', 'name', 'code'],
          through: { 
            attributes: ['id','is_primary', 'assigned_at']
          }
        }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: err.message });
  }
};

// Yeni kullanıcı oluştur (sadece super_admin)
exports.createUser = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, email, password, role, is_active, school_assignments } = req.body;

    if (!password) {
      await t.rollback();
      return res.status(400).json({ message: 'Şifre gereklidir.' });
    }

    const existingUser = await User.findOne({ where: { email }, transaction: t });
    if (existingUser) {
      await t.rollback();
      return res.status(409).json({ message: 'Bu e-posta adresi zaten kullanımda' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      is_active: is_active !== undefined ? is_active : true
    }, { transaction: t });

    if (school_assignments && school_assignments.length > 0) {
      const assignments = school_assignments.map(assignment => ({
        user_id: user.id,
        school_id: assignment.school_id,
  // role_in_school removed
        is_primary: assignment.is_primary || false
      }));
      await UserSchool.bulkCreate(assignments, { transaction: t });
    }
    
    await t.commit();

    const finalUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: School,
        as: 'schools', // 'schools' olarak değiştirildi
        through: { attributes: [] }
      }]
    });

    res.status(201).json(finalUser);
  } catch (err) {
    await t.rollback();
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Kullanıcı oluşturulurken bir hata oluştu: ' + err.message });
  }
};

// Kullanıcı güncelle (sadece super_admin)
exports.updateUser = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { name, email, role, is_active, school_assignments } = req.body;

    const user = await User.findByPk(id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email }, transaction: t });
      if (existingUser) {
        await t.rollback();
        return res.status(409).json({ message: 'Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor' });
      }
    }

    await user.update({
      name: name !== undefined ? name : user.name,
      email: email !== undefined ? email : user.email,
      role: role !== undefined ? role : user.role,
      is_active: is_active !== undefined ? is_active : user.is_active
    }, { transaction: t });

    if (school_assignments !== undefined) {
      await UserSchool.destroy({ where: { user_id: id }, transaction: t });
      
      if (school_assignments.length > 0) {
        const assignments = school_assignments.map(assignment => ({
          user_id: user.id,
          school_id: assignment.school_id,
          // role_in_school removed
          is_primary: assignment.is_primary || false
        }));
        await UserSchool.bulkCreate(assignments, { transaction: t });
      }
    }

    await t.commit();

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: School,
        as: 'schools', // 'schools' olarak değiştirildi
        through: { attributes: [] }
      }]
    });

    res.json(updatedUser);
  } catch (err) {
    await t.rollback();
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Kullanıcı güncellenirken bir hata oluştu: ' + err.message });
  }
};

// Kullanıcı şifre güncelle (sadece super_admin)
exports.updateUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Şifre gereklidir.' });
    }
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({ password: hashedPassword });
    
    res.json({ message: 'Şifre başarıyla güncellendi' });
  } catch (err) {
    console.error('Error updating user password:', err);
    res.status(500).json({ error: err.message });
  }
};

// Kullanıcı sil (sadece super_admin)
exports.deleteUser = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    
    if (req.user.id === parseInt(id)) {
      await t.rollback();
      return res.status(400).json({ message: 'Kendi hesabınızı silemezsiniz' });
    }
    
    const user = await User.findByPk(id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    await UserSchool.destroy({ where: { user_id: id }, transaction: t });
    await user.destroy({ transaction: t });
    
    await t.commit();
    res.json({ message: 'Kullanıcı başarıyla silindi' });
  } catch (err) {
    await t.rollback();
    console.error('Error deleting user:', err);
    res.status(500).json({ error: err.message });
  }
};

// Kullanıcı durumu değiştir (aktif/pasif)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    await user.update({ is_active: !user.is_active });
    
    const userResponse = user.toJSON();
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (err) {
    console.error('Error toggling user status:', err);
    res.status(500).json({ error: err.message });
  }
};

// Okula göre kullanıcıları listele (yetkili admin veya super_admin)
exports.getUsersBySchool = async (req, res) => {
  try {
    const { school_id } = req.params;
    const requestingUser = req.user;

    // Super_admin değilse, kullanıcının o okula erişim yetkisi var mı kontrol et
    if (requestingUser.role !== 'super_admin') {
      const hasAccess = await UserSchool.findOne({
        where: {
          user_id: requestingUser.id,
          school_id: school_id,
          // role_in_school removed
        }
      });
      if (!hasAccess) {
        return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır' });
      }
    }

    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'is_active', 'last_login', 'created_at'],
      include: [
        {
          model: School,
          as: 'schools',
          attributes: ['id', 'name', 'code'],
          where: { id: school_id }, // Filtreleme burada yapılır
          required: true, // Sadece bu okula atanmış kullanıcıları getir (INNER JOIN)
          through: { 
            attributes: ['id','is_primary']
          }
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json(users);
  } catch (err) {
    console.error(`Error fetching users for school ${req.params.school_id}:`, err);
    res.status(500).json({ error: err.message });
  }
};

// Mevcut kullanıcı kendi şifresini değiştirebilsin
exports.updateOwnPassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ message: 'Mevcut ve yeni şifre gerekli' });
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    const match = await bcrypt.compare(current_password, user.password);
    if (!match) return res.status(403).json({ message: 'Mevcut şifre yanlış' });
    if (new_password.length < 6) return res.status(400).json({ message: 'Yeni şifre en az 6 karakter olmalıdır' });
    const hashed = await bcrypt.hash(new_password, 10);
    await user.update({ password: hashed });
    res.json({ message: 'Şifre başarıyla güncellendi' });
  } catch (err) {
    console.error('Error updating own password', err);
    res.status(500).json({ error: err.message });
  }
};

// Get consolidated permissions for a given user_id (all schools)
exports.getPermissionsForUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user id' });

    const { UserPermission, UserSchool, Permission } = require('../models/relations');
    // Find user_schools records for this user
    const userSchools = await UserSchool.findAll({ where: { user_id: userId }, attributes: ['id', 'school_id'] });
    const userSchoolIds = userSchools.map(us => us.id);

    if (userSchoolIds.length === 0) {
      return res.json({ permissions: [] });
    }

    // Debug: log userSchoolIds and ensure models are present
    console.debug('getPermissionsForUser: userSchoolIds=', userSchoolIds);
    console.debug('Models:', { UserPermission: !!UserPermission, Permission: !!Permission });

    // Safer two-step approach: read user_permission rows, extract permission_ids
    const upRows = await UserPermission.findAll({ where: { user_schools_id: userSchoolIds }, attributes: ['permission_id'] });
    const permIds = Array.from(new Set(upRows.map(r => r.permission_id))).filter(Boolean);
    console.debug('getPermissionsForUser: found permission ids=', permIds);
    if (permIds.length === 0) {
      return res.json({ permissions: [] });
    }

    const perms = await Permission.findAll({ where: { id: permIds }, attributes: ['id', 'name'], order: [['name', 'ASC']] });
    res.json({ permissions: perms });
  } catch (err) {
    console.error('getPermissionsForUser error', err);
    // In development return stack to help debugging; in production hide details
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({ error: err.message, stack: err.stack });
    }
    res.status(500).json({ error: 'Server error' });
  }
};