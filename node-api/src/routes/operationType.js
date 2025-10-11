const express = require('express');
const router = express.Router();
const operationTypeController = require('../controllers/operationTypeController');
const { authenticateToken, addUserSchools } = require('../middleware/auth');

router.get('/', authenticateToken, addUserSchools, operationTypeController.getAll);
router.get('/:id', authenticateToken, addUserSchools, operationTypeController.getById);
router.post('/', authenticateToken, addUserSchools, operationTypeController.create);
router.put('/:id', authenticateToken, addUserSchools, operationTypeController.update);
router.delete('/:id', authenticateToken, addUserSchools, operationTypeController.delete);

module.exports = router;