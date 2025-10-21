const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'faults', 'images');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadsDir); },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({ storage });
const ctrl = require('../controllers/faultUploadController');

router.post('/fault-image', upload.single('file'), ctrl.uploadFaultImage);
// delete uploaded fault image by path (expects JSON { path: 'uploads/faults/images/filename' })
router.delete('/fault-image', ctrl.deleteFaultImage);

module.exports = router;
