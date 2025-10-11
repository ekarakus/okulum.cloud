const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticateToken, addUserSchools } = require('../middleware/auth');

router.get('/', authenticateToken, addUserSchools, statsController.getDashboardStats);

module.exports = router;