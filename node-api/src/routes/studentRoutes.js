const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const studentUploadController = require('../controllers/studentUploadController');
const { authenticateToken, requireAdminOrSuperAdmin } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: '/tmp' });

// List distinct classes for a school (public - does not require auth)
router.get('/school/:schoolId/classes', studentController.listClassesBySchool);
// List students for a school
router.get('/school/:schoolId', authenticateToken, studentController.listBySchool);
router.get('/:id', authenticateToken, studentController.get);
router.post('/', authenticateToken, requireAdminOrSuperAdmin, studentController.create);
router.put('/:id', authenticateToken, requireAdminOrSuperAdmin, studentController.update);
router.delete('/:id', authenticateToken, requireAdminOrSuperAdmin, studentController.remove);
router.post('/bulk-delete', authenticateToken, requireAdminOrSuperAdmin, studentController.bulkDelete);
// Upload XLS/XLSX for bulk student import
router.post('/upload', authenticateToken, requireAdminOrSuperAdmin, upload.single('file'), studentUploadController.upload);

module.exports = router;
