const fs = require('fs');
const path = require('path');
const { sequelize, School, SchoolObservance } = require('../models/relations');

// Utility: compute edu year from date
function getCurrentEduYear(now = new Date()) {
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();
  return (month >= 8) ? year : year - 1;
}

// Date helpers
function pad(n) { return n.toString().padStart(2, '0'); }
function toIsoDate(y, m, d) { return `${y}-${pad(m)}-${pad(d)}`; }

// convert dayOfWeek string to 0-6 (Sun-Sat)
const dayNameToIndex = (name) => {
  const map = { sunday:0, monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6 };
  return map[(name||'').toString().trim().toLowerCase()] ?? null;
};

// DateCalculatorService
function calculateForRule(rule, year) {
  const calc = rule.calculation_type;
  const p = rule.params || {};

  const result = { startDate: null, endDate: null };

  try {
    switch ((calc||'').toUpperCase()) {
      case 'FIXED_DATE': {
        const month = parseInt(p.month,10);
        const day = parseInt(p.day,10);
        if (!month || !day) break;
        result.startDate = result.endDate = toIsoDate(year, month, day);
        break;
      }
      case 'FIXED_RANGE': {
        const sm = parseInt(p.start_month,10), sd = parseInt(p.start_day,10);
        const em = parseInt(p.end_month,10), ed = parseInt(p.end_day,10);
        if (!sm || !sd || !em || !ed) break;
        result.startDate = toIsoDate(year, sm, sd);
        result.endDate = toIsoDate(year, em, ed);
        break;
      }
      case 'NTH_DAY_IN_MONTH': {
        const month = parseInt(p.month,10);
        const nth = parseInt(p.nth,10);
        const dow = dayNameToIndex(p.day_of_week);
        if (!month || !nth || dow === null) break;
        // find first day of month
        const first = new Date(year, month-1, 1);
        // find first matching dow in the month
        let firstDow = first.getDay();
        let day = 1 + ((dow - firstDow + 7) % 7) + (Math.max(0, nth-1) * 7);
        if (nth < 0) {
          // last nth: -1 means last
          const lastDay = new Date(year, month, 0).getDate();
          // find last matching dow moving backwards
          let dt = new Date(year, month-1, lastDay);
          while (dt.getDay() !== dow) dt.setDate(dt.getDate()-1);
          day = dt.getDate();
        }
        result.startDate = result.endDate = toIsoDate(year, month, day);
        break;
      }
      case 'NTH_WEEK_IN_MONTH': {
        const month = parseInt(p.month,10);
        const nth = parseInt(p.nth,10);
        if (!month || !nth) break;
        // week starts Monday and ends Sunday
        // find first Monday of month
        const first = new Date(year, month-1, 1);
        const firstDow = first.getDay();
        // convert Sunday(0) to 7 so Monday=1 ... Sunday=7
        const firstMondayOffset = ((8 - firstDow) % 7);
        let startDay = 1 + firstMondayOffset + (nth > 0 ? (nth-1)*7 : 0);
        if (nth < 0) {
          // last week: find last day of month, then back to last Monday
          const lastDate = new Date(year, month, 0);
          const lastDay = lastDate.getDate();
          let dt = new Date(year, month-1, lastDay);
          // find Monday on or before lastDay
          while (dt.getDay() !== 1) dt.setDate(dt.getDate()-1);
          startDay = dt.getDate();
        }
        const start = new Date(year, month-1, startDay);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        result.startDate = toIsoDate(start.getFullYear(), start.getMonth()+1, start.getDate());
        result.endDate = toIsoDate(end.getFullYear(), end.getMonth()+1, end.getDate());
        break;
      }
      case 'WEEK_OF_DATE': {
        const month = parseInt(p.month,10), day = parseInt(p.day,10);
        if (!month || !day) break;
        const dt = new Date(year, month-1, day);
        // find Monday
        const curDow = dt.getDay();
        const monday = new Date(dt);
        // we want Monday as 1 (JS Sunday=0)
        const deltaToMonday = (curDow === 0) ? -6 : (1 - curDow);
        monday.setDate(dt.getDate() + deltaToMonday);
        const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
        result.startDate = toIsoDate(monday.getFullYear(), monday.getMonth()+1, monday.getDate());
        result.endDate = toIsoDate(sunday.getFullYear(), sunday.getMonth()+1, sunday.getDate());
        break;
      }
      case 'MANUAL': {
        result.startDate = null; result.endDate = null; break;
      }
      default: {
        // unknown calc type: skip
        break;
      }
    }
  } catch (err) {
    console.error('Date calc error', err);
  }

  return result;
}

exports.importFromJson = async (req, res) => {
  try {
    const schoolId = parseInt(req.params.school_id,10);
    if (!schoolId) return res.status(400).json({ error: 'Invalid school id' });

    const bodyYear = req.body && req.body.year ? parseInt(req.body.year,10) : null;
    const source_year = bodyYear || getCurrentEduYear(new Date());

    // check duplicate
    const existing = await SchoolObservance.findOne({ where: { school_id: schoolId, source_year } });
    if (existing) return res.status(409).json({ error: 'Bu eğitim yılı için takvim zaten yüklendi.' });

    // read JSON
  // observances.json was moved into the node-api folder (node-api/observances.json)
  const jsonPath = path.join(__dirname, '..', '..', 'observances.json');
    if (!fs.existsSync(jsonPath)) return res.status(500).json({ error: 'observances.json not found on server' });
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return res.status(500).json({ error: 'Invalid observances.json format' });

    const toInsert = [];
    for (const rule of arr) {
      const calc = calculateForRule(rule, source_year);
      const start = calc.startDate;
      const end = calc.endDate;
      // if calculation_type is MANUAL and both null, still insert with nulls
      toInsert.push({
        school_id: schoolId,
        is_active: true,
        name: rule.name,
        description: rule.description || null,
        start_date: start,
        end_date: end,
        source_year,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    const t = await sequelize.transaction();
    try {
      await SchoolObservance.bulkCreate(toInsert, { transaction: t });
      await t.commit();
      return res.status(201).json({ success: true, inserted: toInsert.length });
    } catch (insErr) {
      await t.rollback();
      console.error('bulk insert error', insErr);
      return res.status(500).json({ error: 'Insert error', detail: insErr.message||insErr });
    }
  } catch (err) {
    console.error('importFromJson error', err);
    return res.status(500).json({ error: err.message||err });
  }
};

// List observances for a school with pagination/sort
exports.list = async (req, res) => {
  try {
    console.log('list observances request', { userId: req.user && req.user.id, params: req.params, query: req.query });
    const schoolId = parseInt(req.params.school_id, 10);
    if (!schoolId) return res.status(400).json({ error: 'Invalid school id' });

    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || '10', 10)));
    const offset = (page - 1) * pageSize;
    const sortBy = req.query.sortBy || 'start_date';
    const sortDir = (req.query.sortDir || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const where = { school_id: schoolId };
    // optional filter by source_year
    if (req.query.source_year) where.source_year = parseInt(req.query.source_year, 10);
    // optional search: match name or description
    if (req.query.search) {
      const { Op } = require('sequelize');
      const s = String(req.query.search || '').trim();
      if (s.length > 0) {
        where[Op.or] = [
          { name: { [Op.like]: `%${s}%` } },
          { description: { [Op.like]: `%${s}%` } }
        ];
      }
    }

    const { count, rows } = await SchoolObservance.findAndCountAll({
      where,
      order: [[sortBy, sortDir]],
      limit: pageSize,
      offset
    });

    return res.json({ total: count, page, pageSize, data: rows });
  } catch (err) {
    console.error('list observances error', err);
    return res.status(500).json({ error: err.message || err });
  }
};

// Create observance for a school
exports.create = async (req, res) => {
  try {
    const schoolId = parseInt(req.params.school_id, 10);
    if (!schoolId) return res.status(400).json({ error: 'Invalid school id' });

    const payload = {
      school_id: schoolId,
      is_active: req.body.is_active !== undefined ? !!req.body.is_active : true,
      name: req.body.name || null,
      description: req.body.description || null,
      start_date: req.body.start_date || null,
      end_date: req.body.end_date || null,
      source_year: req.body.source_year || null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const rec = await SchoolObservance.create(payload);
    return res.status(201).json(rec);
  } catch (err) {
    console.error('create observance error', err);
    return res.status(500).json({ error: err.message || err });
  }
};

// Update observance
exports.update = async (req, res) => {
  try {
    const schoolId = parseInt(req.params.school_id, 10);
    const id = parseInt(req.params.id, 10);
    if (!schoolId || !id) return res.status(400).json({ error: 'Invalid id or school id' });

    const rec = await SchoolObservance.findOne({ where: { id, school_id: schoolId } });
    if (!rec) return res.status(404).json({ error: 'Not found' });

    const updates = {};
    ['is_active','name','description','start_date','end_date','source_year'].forEach(k=>{ if (req.body[k]!==undefined) updates[k]=req.body[k]; });
    updates.updated_at = new Date();

    await rec.update(updates);
    return res.json(rec);
  } catch (err) {
    console.error('update observance error', err);
    return res.status(500).json({ error: err.message || err });
  }
};

// Delete observance
exports.remove = async (req, res) => {
  try {
    const schoolId = parseInt(req.params.school_id, 10);
    const id = parseInt(req.params.id, 10);
    if (!schoolId || !id) return res.status(400).json({ error: 'Invalid id or school id' });

    const rec = await SchoolObservance.findOne({ where: { id, school_id: schoolId } });
    if (!rec) return res.status(404).json({ error: 'Not found' });

    await rec.destroy();
    return res.json({ success: true });
  } catch (err) {
    console.error('delete observance error', err);
    return res.status(500).json({ error: err.message || err });
  }
};

// Bulk delete observances by ids for a school
exports.bulkRemove = async (req, res) => {
  try {
    const schoolId = parseInt(req.params.school_id, 10);
    if (!schoolId) return res.status(400).json({ error: 'Invalid school id' });

    const ids = Array.isArray(req.body.ids) ? req.body.ids.map(i=>parseInt(i,10)).filter(Boolean) : [];
    if (ids.length === 0) return res.status(400).json({ error: 'No ids provided' });

    const t = await sequelize.transaction();
    try {
      const del = await SchoolObservance.destroy({ where: { school_id: schoolId, id: ids }, transaction: t });
      await t.commit();
      return res.json({ success: true, deleted: del });
    } catch (e) {
      await t.rollback();
      console.error('bulk delete error', e);
      return res.status(500).json({ error: 'Bulk delete failed', detail: e.message||e });
    }
  } catch (err) {
    console.error('bulkRemove error', err);
    return res.status(500).json({ error: err.message || err });
  }
};
