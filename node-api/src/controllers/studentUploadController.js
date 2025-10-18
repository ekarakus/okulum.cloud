const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { sequelize, Student } = require('../models/relations');

const EXPECTED_HEADERS = ['SINIF','NO','ADI','SOYADI','DOĞUM TARİHİ'];

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

    const headers = rows[0].map(c => c.toString().trim());
    const normalized = headers.map(normalizeHeader);
    const expectedNormalized = EXPECTED_HEADERS.map(normalizeHeader);
    const mapping = {};
    for (const h of expectedNormalized) {
      const idx = normalized.indexOf(h);
      if (idx === -1) mapping[h] = -1; else mapping[h] = idx;
    }
    const headerErrors = [];
    const properNameByNorm = Object.fromEntries(EXPECTED_HEADERS.map(h => [normalizeHeader(h), h]));
    for (const [k,v] of Object.entries(mapping)) {
      if (v === -1) headerErrors.push(`Eksik başlık: ${properNameByNorm[k] || k}`);
    }
    headers.forEach((h, i) => {
      const hn = normalizeHeader(h);
      if (h && !expectedNormalized.includes(hn)) headerErrors.push(`Beklenmeyen başlık: ${h} (sütun ${i+1})`);
    });
    if (headerErrors.length) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid headers', details: headerErrors });
    }

    const records = [];
    const studentNos = new Set();
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0) continue;
    const class_name = (r[mapping[normalizeHeader(EXPECTED_HEADERS[0])]] || '').toString().trim();
    const student_no = (r[mapping[normalizeHeader(EXPECTED_HEADERS[1])]] || '').toString().trim();
    const first_name = (r[mapping[normalizeHeader(EXPECTED_HEADERS[2])]] || '').toString().trim();
    const last_name = (r[mapping[normalizeHeader(EXPECTED_HEADERS[3])]] || '').toString().trim();
    const birth_date = (r[mapping[normalizeHeader(EXPECTED_HEADERS[4])]] || '').toString().trim();

      const rowErrs = [];
      if (!student_no) rowErrs.push('Öğrenci No boş');
      if (!first_name) rowErrs.push('Adı boş');
      if (!last_name) rowErrs.push('Soyadı boş');
  if (class_name && class_name.length > 10) rowErrs.push('SINIF alanı maksimum 10 karakter olmalıdır');
      // Accept Turkish date formats: gg/aa/YYYY, gg-aa-YYYY or gg.aa.YYYY
      let normalizedBirthDate = null;
      if (birth_date) {
        // allow separators: / or - or .
        const trMatch = birth_date.match(/^(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})$/);
        if (!trMatch) {
          // include the raw cell value in the error to make it clear what failed
          rowErrs.push(`Doğum tarihi gg/aa/YYYY, gg-aa-YYYY veya gg.aa.YYYY formatında olmalıdır (girdi: "${birth_date}")`);
        } else {
          const day = Number(trMatch[1]);
          const month = Number(trMatch[2]);
          const year = Number(trMatch[3]);
          // basic range checks
          if (month < 1 || month > 12 || day < 1 || day > 31) {
            rowErrs.push('Geçersiz doğum tarihi (gün/ay aralığı)');
          } else {
            // create ISO date string YYYY-MM-DD
            const dt = new Date(year, month - 1, day);
            if (isNaN(dt.getTime())) {
              rowErrs.push('Geçersiz doğum tarihi');
            } else {
              // normalize into YYYY-MM-DD for DB insertion
              normalizedBirthDate = dt.toISOString().slice(0, 10);
            }
          }
        }
      }

      if (studentNos.has(student_no.toLowerCase())) rowErrs.push('Öğrenci No tekrarı (dosya içinde)');
      studentNos.add(student_no.toLowerCase());

  records.push({ row: i+1, student_no, first_name, last_name, class_name, birth_date: normalizedBirthDate || (birth_date || null), errors: rowErrs });
    }

    // Check uniqueness against DB for student_no
    const nosToCheck = records.map(r => r.student_no.toLowerCase());
    const existingNos = new Set();
    if (nosToCheck.length > 0) {
      const qMarks = nosToCheck.map(() => '?').join(',');
      const existing = await sequelize.query(`SELECT student_no FROM students WHERE LOWER(student_no) IN (${qMarks})`, { replacements: nosToCheck, type: sequelize.QueryTypes.SELECT });
      existing.forEach(e => existingNos.add((e.student_no||'').toLowerCase()));
    }

    for (const rec of records) {
      if (existingNos.has(rec.student_no.toLowerCase())) rec.errors.push('Öğrenci No zaten sistemde kayıtlı');
    }

    const allErrors = records.filter(r => r.errors.length > 0);
    if (allErrors.length > 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Validation errors', rows: allErrors });
    }

    const t = await sequelize.transaction();
    try {
      for (const rec of records) {
    await Student.create({ school_id: req.body.schoolId || req.user?.school_id || null, student_no: rec.student_no, first_name: rec.first_name, last_name: rec.last_name, class_name: rec.class_name || null, birth_date: rec.birth_date }, { transaction: t });
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
    console.error('Student upload error', err);
    return res.status(500).json({ error: err.message || err });
  }
};
