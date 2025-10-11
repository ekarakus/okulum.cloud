const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');
const { authenticateToken, requireSuperAdmin, checkSchoolAccess, addUserSchools } = require('../middleware/auth');

// Kullanıcının okullarını getir
router.get('/my-schools', authenticateToken, schoolController.getUserSchools);

// Tüm okulları listele (sadece super_admin)
router.get('/', authenticateToken, requireSuperAdmin, schoolController.getAllSchools);

// Tek okul getir
router.get('/:id', authenticateToken, checkSchoolAccess, schoolController.getSchoolById);

// Okul istatistikleri
router.get('/:schoolId/stats', authenticateToken, checkSchoolAccess, schoolController.getSchoolStats);

// Yeni okul oluştur (sadece super_admin)
router.post('/', authenticateToken, requireSuperAdmin, schoolController.createSchool);

// Okul güncelle (sadece super_admin)
router.put('/:id', authenticateToken, requireSuperAdmin, schoolController.updateSchool);

// Okul sil (sadece super_admin)
router.delete('/:id', authenticateToken, requireSuperAdmin, schoolController.deleteSchool);

// Kullanıcıya okul ata (sadece super_admin)
router.post('/assign-user', authenticateToken, requireSuperAdmin, schoolController.assignUserToSchool);

// Kullanıcının okul atamasını kaldır (sadece super_admin)
router.post('/remove-user', authenticateToken, requireSuperAdmin, schoolController.removeUserFromSchool);

module.exports = router;