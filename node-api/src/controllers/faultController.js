const { FaultReport, Device, User, School, Location, sequelize, SchoolEmployee } = require('../models/relations');
const { Op } = require('sequelize');
const { UserPermission, Permission, UserSchool } = require('../models/relations');

async function hasSchoolPermission(userId, schoolId, permissionName) {
  if (!userId || !schoolId) return false;
  const [rows] = await sequelize.query(
    `SELECT 1 FROM permissions p
     JOIN user_permissions up ON up.permission_id = p.id
     JOIN user_schools us ON us.id = up.user_schools_id
     WHERE us.user_id = ? AND us.school_id = ? AND p.name = ? LIMIT 1`,
    { replacements: [userId, schoolId, permissionName] }
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function createFault(req, res) {
  try {
    const userId = req.user.id;
  const { school_id, device_id, issue_details, image, requested_by_employee_id } = req.body;
  if (!school_id || !issue_details || !device_id) return res.status(400).json({ message: 'school_id, device_id and issue_details required' });

    if (req.user.role !== 'super_admin') {
  const ok = await hasSchoolPermission(userId, school_id, 'Destek Talepleri');
      if (!ok) return res.status(403).json({ message: 'Yetersiz yetki' });
    }

  // Ensure newly created reports use the canonical status value 'pending'
  const rec = await FaultReport.create({ school_id, device_id: device_id || null, created_by_user_id: userId, requested_by_employee_id: requested_by_employee_id || null, issue_details, image: image || null, operation_id: null, status: 'pending' });
    return res.status(201).json({ fault: rec });
  } catch (err) {
    console.error('createFault error', err);
    return res.status(500).json({ error: err.message });
  }
}

async function listFaultsForSchool(req, res) {
  try {
    const schoolId = parseInt(req.params.schoolId, 10);
    if (isNaN(schoolId)) return res.status(400).json({ message: 'Invalid school id' });
    if (req.user.role !== 'super_admin') {
  const ok = await hasSchoolPermission(req.user.id, schoolId, 'Destek Talepleri');
      if (!ok) return res.status(403).json({ message: 'Yetersiz yetki' });
    }
    const faultsRaw = await FaultReport.findAll({ where: { school_id: schoolId }, order: [['created_at', 'DESC']], include: [
      { model: Device, as: 'Device', include: [{ model: Location, as: 'Location' }] },
      { model: User, as: 'Creator' },
      { model: SchoolEmployee, as: 'RequestedByEmployee' },
      { model: School, as: 'School' }
    ] });
    const faults = (faultsRaw || []).map(f => {
      const o = (typeof f.toJSON === 'function') ? f.toJSON() : f;
      // flatten useful fields for frontend
      o.device_name = (o.Device && o.Device.name) || o.device_name || null;
      o.device_id = (o.Device && o.Device.id) || o.device_id || null;
      o.location_name = (o.Device && o.Device.Location && o.Device.Location.name) || (o.Location && o.Location.name) || o.location_name || null;
      o.location_room_number = (o.Device && o.Device.Location && o.Device.Location.room_number) || (o.Location && o.Location.room_number) || o.location_room_number || null;
  o.user_name = (o.Creator && (o.Creator.name || o.Creator.username)) || o.user_name || null;
  o.requested_by_employee_name = (o.RequestedByEmployee && (o.RequestedByEmployee.name || o.RequestedByEmployee.full_name)) || null;
      return o;
    });
    return res.json({ faults });
  } catch (err) {
    console.error('listFaultsForSchool', err);
    return res.status(500).json({ error: err.message });
  }
}

// Server-side paged list with filters
async function listFaultsPaged(req, res) {
  try {
  const { page = 1, pageSize = 20, search = '', status, school_id, sortField = 'created_at', sortDir = 'DESC' } = req.query;
    const p = parseInt(page, 10) || 1;
    const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));

    if (!school_id) return res.status(400).json({ message: 'school_id is required' });
    const schoolId = parseInt(school_id, 10);
    if (isNaN(schoolId)) return res.status(400).json({ message: 'Invalid school_id' });

    if (req.user.role !== 'super_admin') {
      const ok = await hasSchoolPermission(req.user.id, schoolId, 'Destek Talepleri');
      if (!ok) return res.status(403).json({ message: 'Yetersiz yetki' });
    }

    // Accept legacy value 'open' for compatibility but treat/filter as 'pending'
    const where = { school_id: schoolId };
    if (status) {
      const mappedStatus = (String(status) === 'open') ? 'pending' : status;
      where.status = mappedStatus;
    }
    if (search && search.length > 0) {
      // simple search on issue_details
      where.issue_details = { [Op.like]: `%${search}%` };
    }

    // Build includes array so we can reuse it for ordering by association columns when needed
    const includes = [
      { model: Device, as: 'Device', include: [{ model: Location, as: 'Location' }] },
      { model: User, as: 'Creator' },
      { model: SchoolEmployee, as: 'RequestedByEmployee' },
      { model: School, as: 'School' }
    ];

  // Build order mapping. If sortField refers to an associated/virtual field, map to correct association column
  const dir = sortDir && String(sortDir).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  // Default sort: created_at desc when no sortField provided
  const sf = sortField && String(sortField).trim().length > 0 ? sortField : 'created_at';
    let order;
  switch (sf) {
      case 'device_name':
        order = [[ { model: Device, as: 'Device' }, 'name', dir ]];
        break;
      case 'location_name':
        // sort by device's location name when available
        order = [[ { model: Device, as: 'Device' }, { model: Location, as: 'Location' }, 'name', dir ]];
        break;
      case 'user_name':
        order = [[ { model: User, as: 'Creator' }, 'name', dir ]];
        break;
      case 'requested_by_employee_name':
        order = [[ { model: SchoolEmployee, as: 'RequestedByEmployee' }, 'name', dir ]];
        break;
      case 'created_at':
        order = [[ 'created_at', dir ]];
        break;
      default:
        // fallback: try ordering by a direct column on FaultReport
        order = [[ sf || 'created_at', dir ]];
    }

    const offset = (p - 1) * ps;
    const { count, rows } = await FaultReport.findAndCountAll({ where, order, offset, limit: ps, include: includes });
    const faults = (rows || []).map(f => {
      const o = (typeof f.toJSON === 'function') ? f.toJSON() : f;
      o.device_name = (o.Device && o.Device.name) || o.device_name || null;
      o.device_id = (o.Device && o.Device.id) || o.device_id || null;
      o.location_name = (o.Device && o.Device.Location && o.Device.Location.name) || (o.Location && o.Location.name) || o.location_name || null;
      o.location_room_number = (o.Device && o.Device.Location && o.Device.Location.room_number) || (o.Location && o.Location.room_number) || o.location_room_number || null;
  o.user_name = (o.Creator && (o.Creator.name || o.Creator.username)) || o.user_name || null;
  o.requested_by_employee_name = (o.RequestedByEmployee && (o.RequestedByEmployee.name || o.RequestedByEmployee.full_name)) || null;
      return o;
    });
    return res.json({ total: count, page: p, pageSize: ps, faults });
  } catch (err) {
    console.error('listFaultsPaged', err);
    return res.status(500).json({ error: err.message });
  }
}

async function getFaultById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
    const fault = await FaultReport.findByPk(id, { include: [
      { model: Device, as: 'Device', include: [{ model: Location, as: 'Location' }] },
      { model: User, as: 'Creator' },
      { model: SchoolEmployee, as: 'RequestedByEmployee' },
      { model: School, as: 'School' }
    ] });
    if (!fault) return res.status(404).json({ message: 'Not found' });
    if (req.user.role !== 'super_admin') {
      const ok = await hasSchoolPermission(req.user.id, fault.school_id, 'Destek Talepleri');
      if (!ok) return res.status(403).json({ message: 'Yetersiz yetki' });
    }
    return res.json({ fault });
  } catch (err) {
    console.error('getFaultById', err);
    return res.status(500).json({ error: err.message });
  }
}

async function updateFaultStatus(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
  let { status } = req.body;
  if (!status) return res.status(400).json({ message: 'status required' });
  // accept legacy 'open' but store canonical 'pending'
  if (status === 'open') status = 'pending';
    const fault = await FaultReport.findByPk(id);
    if (!fault) return res.status(404).json({ message: 'Not found' });
    if (req.user.role !== 'super_admin') {
      const ok = await hasSchoolPermission(req.user.id, fault.school_id, 'Destek Talepleri');
      if (!ok) return res.status(403).json({ message: 'Yetersiz yetki' });
    }
  fault.status = status;
    await fault.save();
    return res.json({ fault });
  } catch (err) {
    console.error('updateFaultStatus', err);
    return res.status(500).json({ error: err.message });
  }
}

async function updateFault(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
  const { issue_details, device_id, location_id, image } = req.body;
  let { status } = req.body;
  // support updating the optional requested_by_employee_id
  const requested_by_employee_id = typeof req.body.requested_by_employee_id !== 'undefined' ? req.body.requested_by_employee_id : undefined;
    const fault = await FaultReport.findByPk(id);
    if (!fault) return res.status(404).json({ message: 'Not found' });
    if (req.user.role !== 'super_admin') {
      const ok = await hasSchoolPermission(req.user.id, fault.school_id, 'Destek Talepleri');
      if (!ok) return res.status(403).json({ message: 'Yetersiz yetki' });
    }
    if (typeof issue_details !== 'undefined') fault.issue_details = issue_details;
    if (typeof device_id !== 'undefined') fault.device_id = device_id || null;
    if (typeof location_id !== 'undefined') fault.location_id = location_id || null;
    if (typeof image !== 'undefined') fault.image = image || null;
    if (typeof requested_by_employee_id !== 'undefined') {
      // allow null to clear the value
      fault.requested_by_employee_id = requested_by_employee_id || null;
    }
    if (typeof status !== 'undefined') {
      // accept legacy 'open' but store canonical 'pending'
      fault.status = (status === 'open') ? 'pending' : status;
    }
    await fault.save();
    return res.json({ fault });
  } catch (err) {
    console.error('updateFault', err);
    return res.status(500).json({ error: err.message });
  }
}

async function deleteFault(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
    const fault = await FaultReport.findByPk(id);
    if (!fault) return res.status(404).json({ message: 'Not found' });
    if (req.user.role !== 'super_admin') {
      const ok = await hasSchoolPermission(req.user.id, fault.school_id, 'Destek Talepleri');
      if (!ok) return res.status(403).json({ message: 'Yetersiz yetki' });
    }
    await fault.destroy();
    return res.status(204).send();
  } catch (err) {
    console.error('deleteFault', err);
    return res.status(500).json({ error: err.message });
  }
}

// Accepts { ids: [1,2,3] } and attempts to delete them. Returns { deleted: n, failed: m }
async function bulkDeleteFaults(req, res) {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(i => parseInt(i, 10)).filter(i => !isNaN(i)) : [];
    if (ids.length === 0) return res.status(400).json({ message: 'ids array required' });
    let deleted = 0; let failed = 0; const failures = [];
    for (const id of ids) {
      try {
        const fault = await FaultReport.findByPk(id);
        if (!fault) { failed++; failures.push({ id, reason: 'not found' }); continue; }
        if (req.user.role !== 'super_admin') {
          const ok = await hasSchoolPermission(req.user.id, fault.school_id, 'Destek Talepleri');
          if (!ok) { failed++; failures.push({ id, reason: 'permission' }); continue; }
        }
        await fault.destroy(); deleted++;
      } catch (e) { failed++; failures.push({ id, reason: e.message || 'error' }); }
    }
    return res.json({ deleted, failed, failures });
  } catch (err) {
    console.error('bulkDeleteFaults', err);
    return res.status(500).json({ error: err.message });
  }
}

// Bulk update: accepts { ids: [1,2,3], status: 'pending' }
async function bulkUpdateFaults(req, res) {
  try {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(i => parseInt(i, 10)).filter(i => !isNaN(i)) : [];
  let status = req.body?.status;
    if (ids.length === 0) return res.status(400).json({ message: 'ids array required' });
  if (!status) return res.status(400).json({ message: 'status required' });
  if (status === 'open') status = 'pending';

    let updated = 0; let failed = 0; const failures = [];
    for (const id of ids) {
      try {
        const fault = await FaultReport.findByPk(id);
        if (!fault) { failed++; failures.push({ id, reason: 'not found' }); continue; }
        if (req.user.role !== 'super_admin') {
          const ok = await hasSchoolPermission(req.user.id, fault.school_id, 'Destek Talepleri');
          if (!ok) { failed++; failures.push({ id, reason: 'permission' }); continue; }
        }
  fault.status = status;
        await fault.save();
        updated++;
      } catch (e) { failed++; failures.push({ id, reason: e.message || 'error' }); }
    }
    return res.json({ updated, failed, failures });
  } catch (err) {
    console.error('bulkUpdateFaults', err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { createFault, listFaultsForSchool, listFaultsPaged, getFaultById, updateFaultStatus, updateFault, deleteFault, bulkDeleteFaults, bulkUpdateFaults };
