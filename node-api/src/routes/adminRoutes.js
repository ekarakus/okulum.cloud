const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdminOrSuperAdmin } = require('../middleware/auth');

router.get('/email-logs', authenticateToken, requireAdminOrSuperAdmin, adminController.emailLogs);

module.exports = router;
