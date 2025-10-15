const { Announcement, School } = require('../models/relations');

// GET /api/announcements
exports.listAnnouncements = async (req, res) => {
  try {
    const { school_id, is_active } = req.query;
    const where = {};
    if (typeof school_id !== 'undefined' && school_id !== '') where.school_id = school_id;
    if (typeof is_active !== 'undefined' && is_active !== '') where.is_active = is_active === '1' || is_active === 'true';

    const announcements = await Announcement.findAll({
      where,
      order: [['ord','ASC'], ['publish_date','DESC']],
      include: [ { model: require('../models/announcementAttachment'), as: 'Attachments' } ]
    });
    res.json(announcements);
  } catch (err) {
    console.error('Error listing announcements:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/announcements/:id
exports.getAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const a = await Announcement.findByPk(id, { include: [ { model: require('../models/announcementAttachment'), as: 'Attachments' } ] });
    if (!a) return res.status(404).json({ message: 'Announcement not found' });
    res.json(a);
  } catch (err) {
    console.error('Error fetching announcement:', err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/announcements/:id/attachments
exports.uploadAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findByPk(id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const AnnouncementAttachment = require('../models/announcementAttachment');
    // store web-accessible relative path
    const relPath = req.file.path ? req.file.path.split('uploads')[1] : null;
    const webPath = relPath ? ('/uploads' + relPath) : req.file.path;
    const a = await AnnouncementAttachment.create({
      announcement_id: id,
      filename: req.file.originalname,
      path: webPath,
      mime_type: req.file.mimetype,
      size: req.file.size
    });
    res.status(201).json(a);
  } catch (err) {
    console.error('Error uploading attachment:', err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/announcements
exports.createAnnouncement = async (req, res) => {
  try {
    const payload = req.body;
    const announcement = await Announcement.create({
      school_id: payload.school_id || null,
      title: payload.title,
      content: payload.content || null,
      publish_date: payload.publish_date || null,
      end_date: payload.end_date || null,
      is_active: typeof payload.is_active !== 'undefined' ? !!payload.is_active : true,
      created_by: req.user ? req.user.id : null,
      ord: payload.ord || 0
    });
    res.status(201).json(announcement);
  } catch (err) {
    console.error('Error creating announcement:', err);
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/announcements/:id
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const announcement = await Announcement.findByPk(id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

    await announcement.update({
      school_id: typeof payload.school_id !== 'undefined' ? payload.school_id : announcement.school_id,
      title: typeof payload.title !== 'undefined' ? payload.title : announcement.title,
      content: typeof payload.content !== 'undefined' ? payload.content : announcement.content,
      publish_date: typeof payload.publish_date !== 'undefined' ? payload.publish_date : announcement.publish_date,
      end_date: typeof payload.end_date !== 'undefined' ? payload.end_date : announcement.end_date,
      is_active: typeof payload.is_active !== 'undefined' ? !!payload.is_active : announcement.is_active,
      updated_by: req.user ? req.user.id : announcement.updated_by,
      ord: typeof payload.ord !== 'undefined' ? payload.ord : announcement.ord
    });

    res.json(announcement);
  } catch (err) {
    console.error('Error updating announcement:', err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/announcements/:id
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findByPk(id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    await announcement.destroy();
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    console.error('Error deleting announcement:', err);
    res.status(500).json({ error: err.message });
  }
};
