const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');

router.get('/', announcementController.listAnnouncements);
router.get('/:id', announcementController.getAnnouncement);
router.post('/', announcementController.createAnnouncement);
router.put('/:id', announcementController.updateAnnouncement);
router.delete('/:id', announcementController.deleteAnnouncement);

module.exports = router;
