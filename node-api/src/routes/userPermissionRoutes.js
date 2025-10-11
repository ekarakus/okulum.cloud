const express = require('express');
const router = express.Router();
const userPermissionController = require('../controllers/userPermissionController');
const { authenticateToken } = require('../middleware/auth');

// List assigned permissions and all permissions
router.get('/:user_schools_id', authenticateToken, userPermissionController.listByUserSchool);

// Replace assignments
router.put('/:user_schools_id', authenticateToken, userPermissionController.replaceForUserSchool);

module.exports = router;
