const express = require('express');
const router = express.Router();
const deviceTypeController = require('../controllers/deviceTypeController');
const { authenticateToken, addUserSchools } = require('../middleware/auth');

router.get('/', authenticateToken, addUserSchools, deviceTypeController.getAll);
router.post('/', authenticateToken, addUserSchools, deviceTypeController.create);
router.put('/:id', authenticateToken, addUserSchools, deviceTypeController.update);
router.delete('/:id', authenticateToken, addUserSchools, deviceTypeController.delete);

module.exports = router;