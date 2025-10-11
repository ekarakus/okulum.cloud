const express = require('express');
const router = express.Router();
const featureController = require('../controllers/featureController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, featureController.getAll);
router.get('/:id', authenticateToken, featureController.getById);
router.post('/', authenticateToken, featureController.create);
router.put('/:id', authenticateToken, featureController.update);
router.delete('/:id', authenticateToken, featureController.delete);

module.exports = router;