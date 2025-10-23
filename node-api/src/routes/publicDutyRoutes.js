const express = require('express');
const router = express.Router();
const dutyCtrl = require('../controllers/dutyScheduleController');

// Public endpoint to get current duty schedule for a school and shift
// Example: GET /api/public/duty-schedule/123?shift=1
router.get('/:school_id', dutyCtrl.getCurrent);

module.exports = router;
