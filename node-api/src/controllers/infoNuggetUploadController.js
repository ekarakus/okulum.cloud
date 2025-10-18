const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { sequelize, InfoNugget, InfoNuggetCategory } = require('../models/relations');

function normalize(h) {
  if (!h) return '';
  let s = (h || '').toString().trim().toLowerCase();
  // normalize unicode (remove accents)
  s = s.normalize && s.normalize('NFD').replace(/\p{Diacritic}/gu, '') || s;
  // replace common Turkish letters with ASCII equivalents
  s = s.replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ş/g, 's').replace(/Ş/g, 's').replace(/ğ/g, 'g').replace(/Ğ/g, 'g').replace(/ç/g, 'c').replace(/Ç/g, 'c').replace(/ö/g, 'o').replace(/Ö/g, 'o').replace(/ü/g, 'u').replace(/Ü/g, 'u');
  // remove remaining non-alphanumeric characters except underscore and space
  s = s.replace(/[^a-z0-9_ \-]/g, '');
  return s;
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

    const headers = (rows[0] || []).map(h => h.toString().trim());
    const normalized = headers.map(normalize);
    // allow English or Turkish headers
    const headerAliases = {
      title: ['title','başlık','başlıkı','baslik'],
      text_content: ['text_content','içerik','icerik','içerik_metni','icerik_metni'],
      category: ['category','kategori','kategori_ad','kategoriadi'],
      start_date: ['start_date','başlangıç tarihi','başlangıç_tarihi','baslangic tarihi','baslangic_tarihi','başlangic_tarihi'],
      expiration_date: ['expiration_date','bitiş tarihi','bitis tarihi','bitiş_tarihi','bitis_tarihi'],
      publish_start_time: ['publish_start_time','yayın başlangıç saati','yayin_baslangic_saati','yayin_baslangic'],
      publish_end_time: ['publish_end_time','yayın bitiş saati','yayin_bitis_saati','yayin_bitis']
    };
    const mapping = {};
    for (const key of Object.keys(headerAliases)) {
      let idx = -1;
      for (const alias of headerAliases[key]) { idx = normalized.indexOf(normalize(alias)); if (idx !== -1) break; }
      mapping[key] = idx;
    }
    const missing = Object.entries(mapping).filter(([k,v]) => v === -1 && (k === 'title' || k === 'text_content' || k === 'category')).map(x => x[0]);
    if (missing.length) return res.status(400).json({ error: 'Missing required headers', missing });

    // load categories map
    const cats = await InfoNuggetCategory.findAll();
    const catByName = {}; cats.forEach(c => { catByName[(c.name||'').toString()] = c.id; });

    const records = [];
        const rowErrors = [];
    for (let i=1;i<rows.length;i++){
      const r = rows[i]; if (!r || r.length===0) continue;
      const title = (r[mapping['title']]||'').toString().trim();
      const text_content = (r[mapping['text_content']]||'').toString().trim();
      const categoryName = (r[mapping['category']]||'').toString().trim();
          const rawStart = (r[mapping['start_date']]||'').toString().trim() || null;
          const rawExp = (r[mapping['expiration_date']]||'').toString().trim() || null;
          const rawPublishStart = (r[mapping['publish_start_time']]||'').toString().trim() || null;
          const rawPublishEnd = (r[mapping['publish_end_time']]||'').toString().trim() || null;
          // parse dates (dd.mm.YYYY with separators . - /)
          function parseDateString(s) {
            if (!s) return null;
            const m = s.match(/^(\d{1,2})[\.\-\/]?(\d{1,2})[\.\-\/]?(\d{4})$/);
            if (!m) return null;
            const day = parseInt(m[1],10), month = parseInt(m[2],10), year = parseInt(m[3],10);
            if (month < 1 || month > 12 || day < 1 || day > 31) return null;
            const dt = new Date(year, month-1, day);
            if (isNaN(dt.getTime())) return null;
            return dt.toISOString().slice(0,10);
          }
          // parse time HH:MM or HH:MM:SS
          function parseTimeString(t) {
            if (!t) return null;
            const m = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
            if (!m) return null;
            const hh = parseInt(m[1],10), mm = parseInt(m[2],10), ss = m[3] ? parseInt(m[3],10) : 0;
            if (hh<0||hh>23||mm<0||mm>59||ss<0||ss>59) return null;
            return `${hh.toString().padStart(2,'0')}:${mm.toString().padStart(2,'0')}${m[3] ? ':' + ss.toString().padStart(2,'0') : ''}`;
          }
          const start_date = parseDateString(rawStart);
          const expiration_date = parseDateString(rawExp);
          const publish_start_time = parseTimeString(rawPublishStart);
          const publish_end_time = parseTimeString(rawPublishEnd);
  const is_active = true;
  const category_id = catByName[categoryName] || null;
      const errs = [];
      if (!title) errs.push('Başlık gerekli');
      if (rawStart && !start_date) errs.push('Başlangıç tarihi formatı yanlış (dd.mm.YYYY)');
      if (rawExp && !expiration_date) errs.push('Bitiş tarihi formatı yanlış (dd.mm.YYYY)');
      if (rawPublishStart && !publish_start_time) errs.push('Yayın başlangıç saati formatı yanlış (HH:MM veya HH:MM:SS)');
      if (rawPublishEnd && !publish_end_time) errs.push('Yayın bitiş saati formatı yanlış (HH:MM veya HH:MM:SS)');
      if (errs.length) rowErrors.push({ row: i+1, errors: errs });
      records.push({ title, text_content, category_id, start_date, expiration_date, publish_start_time, publish_end_time, is_active, row: i+1, categoryName });
    }

    if (rowErrors.length) { fs.unlinkSync(req.file.path); return res.status(400).json({ error: 'Validation errors', rows: rowErrors }); }

    const t = await sequelize.transaction();
    try {
      for (const rec of records) {
        await InfoNugget.create({ category_id: rec.category_id || null, title: rec.title || null, text_content: rec.text_content || null, start_date: rec.start_date || null, expiration_date: rec.expiration_date || null, publish_start_time: rec.publish_start_time || null, publish_end_time: rec.publish_end_time || null, is_active: rec.is_active }, { transaction: t });
      }
      await t.commit();
    } catch (insErr) {
      await t.rollback(); fs.unlinkSync(req.file.path); return res.status(500).json({ error: 'Insert error', detail: insErr.message||insErr });
    }

    fs.unlinkSync(req.file.path);
    return res.json({ success: true, inserted: records.length });
  } catch (err) {
    console.error('InfoNugget upload error', err); return res.status(500).json({ error: err.message || err });
  }
};
