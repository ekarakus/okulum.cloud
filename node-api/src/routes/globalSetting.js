const express = require('express');
const router = express.Router();
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const { getSettings, upsertSettings, testEmail } = require('../controllers/globalSettingController');

router.get('/', authenticateToken, requireSuperAdmin, getSettings);
router.post('/', authenticateToken, requireSuperAdmin, upsertSettings);
router.put('/', authenticateToken, requireSuperAdmin, upsertSettings);
router.post('/test-email', authenticateToken, requireSuperAdmin, testEmail);

module.exports = router;
