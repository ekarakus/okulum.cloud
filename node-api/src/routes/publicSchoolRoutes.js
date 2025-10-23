const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');

// Public route to resolve school by code (no auth required)
router.get('/by-code/:code', schoolController.getSchoolByCode);

// Public route to get school by numeric id (no auth) - used by kiosks/static pages
router.get('/id/:id', schoolController.getSchoolById);

module.exports = router;
