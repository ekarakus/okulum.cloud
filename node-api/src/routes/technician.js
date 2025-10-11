const express = require('express');
const router = express.Router();
const technicianController = require('../controllers/technicianController');
const { authenticateToken } = require('../middleware/auth');


// Routes with authentication
router.get('/', authenticateToken, technicianController.getAll);
router.get('/:id', authenticateToken, technicianController.getById);
router.post('/', authenticateToken, technicianController.create);
router.put('/:id', authenticateToken, technicianController.update);
router.delete('/:id', authenticateToken, technicianController.delete);

module.exports = router;