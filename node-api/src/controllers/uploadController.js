const path = require('path');
const fs = require('fs');

exports.uploadSchoolLogo = async (req, res) => {
  try {
    console.log('[uploadSchoolLogo] req.file:', req.file && {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size
    });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'school-logos');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    // If multer's diskStorage used, req.file.path should point to the saved file
    let finalFilename = req.file.filename || req.file.originalname;
    let savedPath = req.file.path || null;

    // If file was stored in a temp location (unlikely with diskStorage above), try to move it
    if (savedPath && fs.existsSync(savedPath)) {
      // If savedPath is already inside our uploadsDir and filename matches, keep it
      if (!savedPath.startsWith(uploadsDir)) {
        const target = path.join(uploadsDir, finalFilename);
        try {
          fs.renameSync(savedPath, target);
          savedPath = target;
        } catch (mvErr) {
          console.warn('Could not move uploaded file to uploadsDir, leaving original path', mvErr.message);
        }
      }
    } else {
      // savedPath not provided by multer (or doesn't exist). If multer wrote directly to uploadsDir, compute filename
      const candidate = path.join(uploadsDir, finalFilename);
      if (fs.existsSync(candidate)) {
        savedPath = candidate;
      } else {
        // Best effort fallback: check if multer stored with another generated filename (req.file.filename) inside uploadsDir
        const alt = req.file.filename ? path.join(uploadsDir, req.file.filename) : null;
        if (alt && fs.existsSync(alt)) {
          savedPath = alt;
          finalFilename = req.file.filename;
        }
      }
    }

    console.log('[uploadSchoolLogo] savedPath candidate:', savedPath);
    if (!savedPath || !fs.existsSync(savedPath)) {
      console.error('Upload error: saved file not found', { savedPath, reqFile: req.file });
      return res.status(500).json({ message: 'Uploaded file not found on server' });
    }

    // Return a relative web-path to the uploaded file
    const relativePath = path.join('uploads', 'school-logos', path.basename(savedPath));
    return res.json({ path: relativePath });
  } catch (err) {
    console.error('Upload error', err);
    res.status(500).json({ error: err.message });
  }
};
