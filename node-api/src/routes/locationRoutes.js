const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

router.get('/provinces', locationController.listProvinces);
router.get('/provinces/:provinceId/districts', locationController.listDistricts);

module.exports = router;
