const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/infoNuggetController');
const multer = require('multer');
const upload = multer({ dest: '/tmp' });
const { authenticateToken, requireAdminOrSuperAdmin } = require('../middleware/auth');
const uploadCtrl = require('../controllers/infoNuggetUploadController');

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.post('/upload', authenticateToken, requireAdminOrSuperAdmin, upload.single('file'), uploadCtrl.upload);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.delete);

module.exports = router;
