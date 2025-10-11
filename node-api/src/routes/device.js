const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { authenticateToken, addUserSchools } = require('../middleware/auth');

router.get('/', authenticateToken, addUserSchools, deviceController.getAll);
router.get('/recent', authenticateToken, addUserSchools, deviceController.getRecent);
router.get('/:id', deviceController.getById); // Herkese açık - QR kod için
router.post('/', authenticateToken, addUserSchools, deviceController.create);
router.put('/:id', authenticateToken, addUserSchools, deviceController.update);
router.delete('/:id', authenticateToken, addUserSchools, deviceController.delete);
router.get('/:id/qr', authenticateToken, deviceController.getQR);

module.exports = router;
