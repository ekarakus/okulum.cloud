const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists before configuring multer
const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'school-logos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// store files in uploads/school-logos with unique filenames
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({ storage });
const uploadController = require('../controllers/uploadController');

router.post('/school-logo', upload.single('file'), uploadController.uploadSchoolLogo);

module.exports = router;
