const path = require('path');
const fs = require('fs');

exports.uploadFaultImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'faults', 'images');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    let finalFilename = req.file.filename || req.file.originalname;
    let savedPath = req.file.path || null;

    if (savedPath && fs.existsSync(savedPath)) {
      if (!savedPath.startsWith(uploadsDir)) {
        const target = path.join(uploadsDir, finalFilename);
        try { fs.renameSync(savedPath, target); savedPath = target; } catch(e) { /* ignore */ }
      }
    } else {
      const candidate = path.join(uploadsDir, finalFilename);
      if (fs.existsSync(candidate)) savedPath = candidate;
    }

    if (!savedPath || !fs.existsSync(savedPath)) return res.status(500).json({ message: 'Uploaded file not found on server' });

    const relativePath = path.join('uploads', 'faults', 'images', path.basename(savedPath));
    return res.json({ path: relativePath });
  } catch (err) {
    console.error('fault image upload error', err);
    return res.status(500).json({ error: err.message });
  }
};
