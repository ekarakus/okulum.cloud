const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// Public: list classes for a school (already public in studentRoutes)
router.get('/school/:schoolId/classes', studentController.listClassesBySchool);
// Public: list students for a school (public version) - reuse controller but exposed publicly
router.get('/school/:schoolId', studentController.listBySchool);

module.exports = router;
