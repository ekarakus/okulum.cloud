const express = require('express');
const router = express.Router();
const faultCtrl = require('../controllers/faultController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, faultCtrl.createFault);
router.get('/school/:schoolId', authenticateToken, faultCtrl.listFaultsForSchool);

// New endpoints
router.get('/', authenticateToken, faultCtrl.listFaultsPaged);
router.get('/:id', authenticateToken, faultCtrl.getFaultById);
router.patch('/:id/status', authenticateToken, faultCtrl.updateFaultStatus);
router.delete('/:id', authenticateToken, faultCtrl.deleteFault);
router.post('/bulk-delete', authenticateToken, faultCtrl.bulkDeleteFaults);
router.post('/bulk-update', authenticateToken, faultCtrl.bulkUpdateFaults);

module.exports = router;
