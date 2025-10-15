const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const multer = require('multer');
const path = require('path');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'announcements');
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		try { require('fs').mkdirSync(uploadsDir, { recursive: true }); } catch (e) {}
		cb(null, uploadsDir);
	},
	filename: function (req, file, cb) {
		const unique = Date.now() + '-' + Math.round(Math.random()*1e9);
		const safe = file.originalname.replace(/[^a-z0-9_.-]/gi, '_');
		cb(null, unique + '-' + safe);
	}
});
const upload = multer({ storage });

// separate storage for editor images
const imagesDir = path.join(__dirname, '..', '..', 'uploads', 'announcements', 'images');
const imageStorage = multer.diskStorage({
	destination: function (req, file, cb) {
		try { require('fs').mkdirSync(imagesDir, { recursive: true }); } catch (e) {}
		cb(null, imagesDir);
	},
	filename: function (req, file, cb) {
		const unique = Date.now() + '-' + Math.round(Math.random()*1e9);
		const safe = file.originalname.replace(/[^a-z0-9_.-]/gi, '_');
		cb(null, unique + '-' + safe);
	}
});
const uploadImage = multer({ storage: imageStorage });

router.get('/', announcementController.listAnnouncements);
router.get('/:id', announcementController.getAnnouncement);
router.post('/', announcementController.createAnnouncement);
router.post('/:id/attachments', upload.single('file'), announcementController.uploadAttachment);
// Image upload endpoint for CKEditor - receives multipart form-data with 'upload' field
router.post('/images', uploadImage.single('upload'), (req, res) => {
	if (!req.file) return res.status(400).json({ error: 'No file' });
	// return object compatible with CKEditor simple upload adapter
	const relPath = path.join('/uploads', 'announcements', 'images', req.file.filename).replace(/\\/g, '/');
	// Build an absolute URL so clients (editors) can fetch the image regardless of frontend origin
	const proto = req.headers['x-forwarded-proto'] || req.protocol;
	const host = req.get('host');
	const base = (process.env.API_BASE_URL && process.env.API_BASE_URL.length) ? process.env.API_BASE_URL.replace(/\/$/, '') : `${proto}://${host}`;
	const absUrl = base + relPath;
	return res.status(201).json({ url: absUrl });
});
router.put('/:id', announcementController.updateAnnouncement);
router.delete('/:id', announcementController.deleteAnnouncement);

module.exports = router;
