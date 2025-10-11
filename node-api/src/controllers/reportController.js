const Device = require('../models/Device');
const DeviceType = require('../models/deviceType');
const Location = require('../models/location');

async function devicesGroupedByLocation(req, res){
  try {
    const schoolId = req.query.school_id || req.user?.school_id;
    if (!schoolId) return res.status(400).json({ error: 'school_id gerekli' });
    const filterDeviceType = req.query.filter_device_type;
    const filterLocation = req.query.filter_location;
    const where = { school_id: schoolId };
    if (filterDeviceType && filterDeviceType !== 'all') {
      const tid = parseInt(filterDeviceType, 10);
      if (!isNaN(tid)) where.device_type_id = tid;
    }
    if (filterLocation && filterLocation !== 'all') {
      const lid = parseInt(filterLocation, 10);
      if (!isNaN(lid)) where.location_id = lid;
    }
    const devices = await Device.findAll({ where });
    // load related names
    const locations = await Location.findAll({ where: { school_id: schoolId } });
    const locMap = {};
    locations.forEach(l => locMap[l.id] = l.name);
    const grouped = {};
    devices.forEach(d => {
      const key = locMap[d.location_id] || 'Bilinmeyen';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        identity_no: d.identity_no,
        name: d.name,
        serial_no: d.serial_no,
        user: d.user,
        device_type_id: d.device_type_id,
        location: key
      });
    });
    // fetch device type names
    const typeIds = [...new Set(devices.map(d=>d.device_type_id).filter(Boolean))];
    const types = await DeviceType.findAll({ where: { id: typeIds } });
    const typeMap = {};
    types.forEach(t=> typeMap[t.id] = t.name);
    // replace device_type_id with name
    Object.keys(grouped).forEach(group => {
      grouped[group] = grouped[group].map(item => ({
        identity_no: item.identity_no,
        name: item.name,
        serial_no: item.serial_no,
        user: item.user,
        device_type: typeMap[item.device_type_id] || 'Bilinmeyen',
        location: item.location
      }));
    });
    res.json({ grouped });
  } catch(e){
    console.error('devicesGroupedByLocation', e);
    res.status(500).json({ error: 'Rapor oluşturulamadı' });
  }
}

async function devicesGroupedByDeviceType(req, res){
  try {
    const schoolId = req.query.school_id || req.user?.school_id;
    if (!schoolId) return res.status(400).json({ error: 'school_id gerekli' });
    const filterDeviceType = req.query.filter_device_type;
    const where = { school_id: schoolId };
    if (filterDeviceType && filterDeviceType !== 'all') {
      const tid = parseInt(filterDeviceType, 10);
      if (!isNaN(tid)) where.device_type_id = tid;
    }
    const devices = await Device.findAll({ where });
    const types = await DeviceType.findAll();
    const typeMap = {};
    types.forEach(t=> typeMap[t.id] = t.name);
    const grouped = {};
    devices.forEach(d => {
      const key = typeMap[d.device_type_id] || 'Bilinmeyen';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        identity_no: d.identity_no,
        name: d.name,
        serial_no: d.serial_no,
        user: d.user,
        device_type: key,
        location_id: d.location_id
      });
    });
    // load location names
    const locIds = [...new Set(devices.map(d=>d.location_id).filter(Boolean))];
    const locations = await Location.findAll({ where: { id: locIds } });
    const locMap = {}; locations.forEach(l=> locMap[l.id] = l.name);
    Object.keys(grouped).forEach(group => {
      grouped[group] = grouped[group].map(item => ({
        identity_no: item.identity_no,
        name: item.name,
        serial_no: item.serial_no,
        user: item.user,
        device_type: item.device_type,
        location: locMap[item.location_id] || 'Bilinmeyen'
      }));
    });
    res.json({ grouped });
  } catch(e){
    console.error('devicesGroupedByDeviceType', e);
    res.status(500).json({ error: 'Rapor oluşturulamadı' });
  }
}

module.exports = { devicesGroupedByLocation, devicesGroupedByDeviceType };
