const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, locationController.getAll);
router.post('/', authenticateToken, locationController.create);
router.put('/:id', authenticateToken, locationController.update);
router.delete('/:id', authenticateToken, locationController.delete);

module.exports = router;
