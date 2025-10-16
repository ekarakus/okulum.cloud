const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, requireAdminOrSuperAdmin } = require('../middleware/auth');

// List students for a school
router.get('/school/:schoolId', authenticateToken, studentController.listBySchool);
router.get('/:id', authenticateToken, studentController.get);
router.post('/', authenticateToken, requireAdminOrSuperAdmin, studentController.create);
router.put('/:id', authenticateToken, requireAdminOrSuperAdmin, studentController.update);
router.delete('/:id', authenticateToken, requireAdminOrSuperAdmin, studentController.remove);
router.post('/bulk-delete', authenticateToken, requireAdminOrSuperAdmin, studentController.bulkDelete);

module.exports = router;
