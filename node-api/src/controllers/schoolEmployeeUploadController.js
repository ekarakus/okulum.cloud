const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { sequelize, EmployeeType, SchoolEmployee, User } = require('../models/relations');

// Expected headers (case-insensitive)
const EXPECTED_HEADERS = ['Ad Soyad','Görevi','Branş','E-mail'];

function normalizeHeader(h) {
  return (h || '').toString().trim().toLowerCase();
}

exports.upload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!['.xls', '.xlsx'].includes(ext)) return res.status(400).json({ error: 'Only .xls or .xlsx files are allowed' });

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (!rows || rows.length === 0) return res.status(400).json({ error: 'Empty spreadsheet' });

    // Validate headers
    const headers = rows[0].map(c => c.toString().trim());
    const normalized = headers.map(normalizeHeader);
    const expectedNormalized = EXPECTED_HEADERS.map(normalizeHeader);
    // Find mapping of expected header index
    const mapping = {};
    for (const h of expectedNormalized) {
      const idx = normalized.indexOf(h);
      if (idx === -1) mapping[h] = -1; else mapping[h] = idx;
    }
    const headerErrors = [];
    // proper name map for messages
    const properNameByNorm = Object.fromEntries(EXPECTED_HEADERS.map(h => [normalizeHeader(h), h]));
    for (const [k,v] of Object.entries(mapping)) {
      if (v === -1) headerErrors.push(`Eksik başlık: ${properNameByNorm[k] || k}`);
    }
    // detect unexpected headers (non-empty headers not in expected list)
    headers.forEach((h, i) => {
      const hn = normalizeHeader(h);
      if (h && !expectedNormalized.includes(hn)) headerErrors.push(`Beklenmeyen başlık: ${h} (sütun ${i+1})`);
    });
    if (headerErrors.length) return res.status(400).json({ error: 'Invalid headers', details: headerErrors });

    // Prepare employee types map
    const types = await EmployeeType.findAll();
    const typeByName = {};
    types.forEach(t => { typeByName[(t.name||'').toString().trim().toLowerCase()] = t; });

    // Collect rows (from row 2 onwards)
    const records = [];
    const fileErrors = [];
    const emailsInFile = new Set();
    const namesInFile = new Set();

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0) continue;
      const name = (r[mapping[normalizeHeader(EXPECTED_HEADERS[0])]] || '').toString().trim();
      const role = (r[mapping[normalizeHeader(EXPECTED_HEADERS[1])]] || '').toString().trim();
      const branch = (r[mapping[normalizeHeader(EXPECTED_HEADERS[2])]] || '').toString().trim();
      const email = (r[mapping[normalizeHeader(EXPECTED_HEADERS[3])]] || '').toString().trim();

      const rowErrs = [];
      if (!name) rowErrs.push('Ad Soyad boş');
      if (!role) rowErrs.push('Görevi boş');
      // Role must match an existing employee type by name
      const type = typeByName[role.toLowerCase()];
      if (!type) rowErrs.push(`Bilinmeyen görev: ${role}`);

      // email uniqueness in file
      if (email) {
        const le = email.toLowerCase();
        if (emailsInFile.has(le)) rowErrs.push('E-mail tekrarı (dosya içinde)');
        emailsInFile.add(le);
      }

      // name uniqueness in file
      const lname = name.toLowerCase();
      if (namesInFile.has(lname)) rowErrs.push('Ad Soyad tekrarı (dosya içinde)');
      namesInFile.add(lname);

      records.push({ row: i+1, name, role, branch, email, typeId: type ? type.id : null, errors: rowErrs });
    }

    // Check uniqueness against DB for emails and names
    const emailsToCheck = records.filter(r => r.email).map(r => r.email.toLowerCase());
    const namesToCheck = records.map(r => r.name.toLowerCase());

    const existingEmails = new Set();
    if (emailsToCheck.length > 0) {
      const qMarks = emailsToCheck.map(() => '?').join(',');
      // Only check school_employees for existing emails (do not check users table)
      const existingEmpEmails = await sequelize.query(`SELECT email FROM school_employees WHERE email IS NOT NULL AND LOWER(email) IN (${qMarks})`, { replacements: emailsToCheck, type: sequelize.QueryTypes.SELECT });
      existingEmpEmails.forEach(u => existingEmails.add((u.email||'').toLowerCase()));
    }

    const existingNames = new Set();
    if (namesToCheck.length > 0) {
      const qMarksN = namesToCheck.map(() => '?').join(',');
      const existingEmployees = await sequelize.query(`SELECT LOWER(name) as name FROM school_employees WHERE LOWER(name) IN (${qMarksN})`, { replacements: namesToCheck, type: sequelize.QueryTypes.SELECT });
      existingEmployees.forEach(e => existingNames.add(e.name));
    }

    for (const rec of records) {
      if (rec.email && existingEmails.has(rec.email.toLowerCase())) rec.errors.push('E-mail zaten kullanılıyor');
      if (existingNames.has(rec.name.toLowerCase())) rec.errors.push('Ad Soyad zaten sistemde kayıtlı');
    }

    // If any errors, return structured error list
    const allErrors = records.filter(r => r.errors.length > 0);
    if (allErrors.length > 0) {
      // Remove temp file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Validation errors', rows: allErrors });
    }

    // Insert records in transaction
    const t = await sequelize.transaction();
    try {
      for (const rec of records) {
        await SchoolEmployee.create({ school_id: req.body.schoolId || req.user?.school_id || null, name: rec.name, branch: rec.branch, email: rec.email || null, employee_type_id: rec.typeId }, { transaction: t });
      }
      await t.commit();
    } catch (insErr) {
      await t.rollback();
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ error: 'Insert error', detail: insErr.message || insErr });
    }

    fs.unlinkSync(req.file.path);
    return res.json({ success: true, inserted: records.length });
  } catch (err) {
    console.error('Upload error', err);
    return res.status(500).json({ error: err.message || err });
  }
};
