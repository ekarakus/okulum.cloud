const express = require('express');
const router = express.Router();
const employeeTypeController = require('../controllers/employeeTypeController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

// List and read are open to admins; create/update/delete require super admin
router.get('/', authenticateToken, employeeTypeController.list);
router.get('/:id', authenticateToken, employeeTypeController.get);
router.post('/', authenticateToken, requireSuperAdmin, employeeTypeController.create);
router.put('/:id', authenticateToken, requireSuperAdmin, employeeTypeController.update);
router.delete('/:id', authenticateToken, requireSuperAdmin, employeeTypeController.remove);

module.exports = router;
