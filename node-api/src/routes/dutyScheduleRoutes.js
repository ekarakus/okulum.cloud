const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dutyScheduleController');
const { authenticateToken, addUserSchools, checkSchoolAccess, requireAdminOrSuperAdmin } = require('../middleware/auth');

// Create schedule
router.post('/', authenticateToken, requireAdminOrSuperAdmin, ctrl.create);

// List schedules for a school
router.get('/list/:school_id', authenticateToken, addUserSchools, ctrl.listForSchool);

// Get schedule by id
router.get('/id/:id', authenticateToken, addUserSchools, ctrl.getById);

// Add assignments to a schedule
router.post('/:id/assignments', authenticateToken, requireAdminOrSuperAdmin, ctrl.addAssignments);

// Replace assignments for a schedule
router.put('/:id/assignments', authenticateToken, requireAdminOrSuperAdmin, ctrl.replaceAssignments);

// Get current active schedule for a school and shift
router.get('/:school_id', authenticateToken, addUserSchools, ctrl.getCurrent);

// Update schedule
router.put('/:id', authenticateToken, requireAdminOrSuperAdmin, ctrl.update);

// Delete schedule
router.delete('/:id', authenticateToken, requireAdminOrSuperAdmin, ctrl.remove);

module.exports = router;
