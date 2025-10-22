const express = require('express');
const router = express.Router();
const operationController = require('../controllers/operationController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, operationController.getAll);
router.get('/recent', authenticateToken, operationController.getRecent);
router.post('/counts', authenticateToken, operationController.countBySupportIds);
router.post('/', authenticateToken, operationController.create);
router.put('/:id', authenticateToken, operationController.update);
router.delete('/:id', authenticateToken, operationController.delete);

module.exports = router;
