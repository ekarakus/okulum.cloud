const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: require('path').join(__dirname, '../../tmp') });
const { authenticateToken, requireAdminOrSuperAdmin } = require('../middleware/auth');
const controller = require('../controllers/schoolEmployeeUploadController');

router.post('/', authenticateToken, requireAdminOrSuperAdmin, upload.single('file'), controller.upload);

module.exports = router;
