const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireSuperAdmin, requireAdminOrSuperAdmin } = require('../middleware/auth');

// Tüm kullanıcıları listele (sadece super_admin)
router.get('/', authenticateToken, requireSuperAdmin, userController.getAllUsers);

// Belirli bir okuldaki kullanıcıları listele (yetkili admin veya super_admin)
router.get('/school/:school_id', authenticateToken, requireAdminOrSuperAdmin, userController.getUsersBySchool);

// Tek kullanıcı getir (sadece super_admin)
router.get('/:id', authenticateToken, requireSuperAdmin, userController.getUserById);

// Yeni kullanıcı oluştur (sadece super_admin)
router.post('/', authenticateToken, requireSuperAdmin, userController.createUser);

// Kullanıcı güncelle (sadece super_admin)
router.put('/:id', authenticateToken, requireSuperAdmin, userController.updateUser);

// Mevcut kullanıcı kendi şifresini değiştirsin
router.put('/me/password', authenticateToken, userController.updateOwnPassword);

// Kullanıcı şifre güncelle (sadece super_admin)
router.put('/:id/password', authenticateToken, requireSuperAdmin, userController.updateUserPassword);

// Kullanıcı durumu değiştir (aktif/pasif) (sadece super_admin)
router.put('/:id/toggle-status', authenticateToken, requireSuperAdmin, userController.toggleUserStatus);

// Kullanıcı sil (sadece super_admin)
router.delete('/:id', authenticateToken, requireSuperAdmin, userController.deleteUser);

module.exports = router;