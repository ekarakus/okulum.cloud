const express = require('express');
const router = express.Router();
const dutyLocationController = require('../controllers/dutyLocationController');
const { authenticateToken, addUserSchools } = require('../middleware/auth');

// List and CRUD operations require authentication and user schools
router.get('/', authenticateToken, addUserSchools, dutyLocationController.getAll);
router.post('/', authenticateToken, addUserSchools, dutyLocationController.create);
router.put('/:id', authenticateToken, addUserSchools, dutyLocationController.update);
router.delete('/:id', authenticateToken, addUserSchools, dutyLocationController.delete);

module.exports = router;
