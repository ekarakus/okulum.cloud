const express = require('express');
const router = express.Router();
const { devicesGroupedByLocation, devicesGroupedByDeviceType } = require('../controllers/reportController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

// Allow admins and superadmins to request school reports. If superadmin, can pass school_id query param.
router.get('/devices/grouped-by-location', authenticateToken, devicesGroupedByLocation);
router.get('/devices/grouped-by-device-type', authenticateToken, devicesGroupedByDeviceType);

module.exports = router;
