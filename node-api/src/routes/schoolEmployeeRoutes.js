const express = require('express');
const router = express.Router();
const schoolEmployeeController = require('../controllers/schoolEmployeeController');
const { authenticateToken, requireAdminOrSuperAdmin } = require('../middleware/auth');

// List employees for a school
router.get('/school/:schoolId', authenticateToken, schoolEmployeeController.listBySchool);
router.get('/:id', authenticateToken, schoolEmployeeController.get);
router.post('/', authenticateToken, requireAdminOrSuperAdmin, schoolEmployeeController.create);
router.put('/:id', authenticateToken, requireAdminOrSuperAdmin, schoolEmployeeController.update);
router.delete('/:id', authenticateToken, requireAdminOrSuperAdmin, schoolEmployeeController.remove);

module.exports = router;
