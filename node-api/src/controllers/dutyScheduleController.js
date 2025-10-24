const { sequelize, DutySchedule, DutyScheduleAssignment, DutyLocation, SchoolEmployee, EmployeeType } = require('../models/relations');
const { Op } = require('sequelize');

exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { school_id, name, shift, effective_from, is_active, assignments } = req.body;
    if (!school_id || !name || !shift || !effective_from) {
      return res.status(400).json({ message: 'school_id, name, shift, effective_from gerekli' });
    }

    const schedule = await DutySchedule.create({ school_id, name, shift, effective_from, is_active: is_active !== false }, { transaction: t });

    if (Array.isArray(assignments) && assignments.length) {
      const rows = assignments.map(a => ({
        duty_schedule_id: schedule.id,
        day_of_week: a.day_of_week,
        duty_location_id: a.duty_location_id,
        school_employee_id: a.school_employee_id
      }));
      await DutyScheduleAssignment.bulkCreate(rows, { transaction: t });
    }

    await t.commit();
    res.status(201).json(schedule);
  } catch (err) {
    await t.rollback();
    console.error('Create duty schedule failed', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

exports.addAssignments = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { assignments } = req.body;
    if (!Array.isArray(assignments) || !assignments.length) return res.status(400).json({ message: 'assignments boş olamaz' });
    const schedule = await DutySchedule.findByPk(id);
    if (!schedule) return res.status(404).json({ message: 'Plan bulunamadı' });
    const rows = assignments.map(a => ({
      duty_schedule_id: schedule.id,
      day_of_week: a.day_of_week,
      duty_location_id: a.duty_location_id,
      school_employee_id: a.school_employee_id
    }));
    await DutyScheduleAssignment.bulkCreate(rows, { transaction: t });
    await t.commit();
    res.json({ message: 'Eklendi' });
  } catch (err) {
    await t.rollback();
    console.error('Add assignments failed', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

exports.getCurrent = async (req, res) => {
  try {
    const { school_id } = req.params;
    const { shift } = req.query;
    if (!school_id || !shift) return res.status(400).json({ message: 'school_id ve shift gerekli' });

    // Map shift number to string
    const shiftMap = { '1': 'morning', '2': 'afternoon' };
    const shiftValue = shiftMap[shift] || shift;

    const schedule = await DutySchedule.findOne({
      where: { school_id, shift: shiftValue, is_active: true },
      include: [{
        model: DutyScheduleAssignment,
        as: 'Assignments',
        include: [
          { model: DutyLocation, as: 'DutyLocation' },
          { model: SchoolEmployee, as: 'Employee' }
        ]
      }]
    });
    if (!schedule) return res.json(null);
    res.json(schedule);
  } catch (err) {
    console.error('Get current duty schedule failed', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

exports.listForSchool = async (req, res) => {
  try {
    const { school_id } = req.params;
    if (!school_id) return res.status(400).json({ message: 'school_id gerekli' });
    const schedules = await DutySchedule.findAll({ where: { school_id }, order: [['effective_from', 'DESC']] });
    res.json(schedules);
  } catch (err) {
    console.error('List duty schedules failed', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'id gerekli' });
    const schedule = await DutySchedule.findByPk(id, {
      include: [{ model: DutyScheduleAssignment, as: 'Assignments', include: [{ model: DutyLocation, as: 'DutyLocation' }, { model: SchoolEmployee, as: 'Employee' }] }]
    });
    if (!schedule) return res.status(404).json({ message: 'Plan bulunamadı' });
    res.json(schedule);
  } catch (err) {
    console.error('Get duty schedule by id failed', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// Replace assignments for a schedule (delete existing, insert new)
exports.replaceAssignments = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { assignments } = req.body;
    if (!id) return res.status(400).json({ message: 'id gerekli' });
    const schedule = await DutySchedule.findByPk(id);
    if (!schedule) return res.status(404).json({ message: 'Plan bulunamadı' });
    // delete existing
    await DutyScheduleAssignment.destroy({ where: { duty_schedule_id: id }, transaction: t });
    // insert new
    if (Array.isArray(assignments) && assignments.length) {
      const rows = assignments.map(a => ({
        duty_schedule_id: id,
        day_of_week: a.day_of_week,
        duty_location_id: a.duty_location_id,
        school_employee_id: a.school_employee_id
      }));
      await DutyScheduleAssignment.bulkCreate(rows, { transaction: t });
    }
    await t.commit();
    res.json({ message: 'Atamalar güncellendi' });
  } catch (err) {
    await t.rollback();
    console.error('Replace assignments failed', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

exports.update = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const item = await DutySchedule.findByPk(id);
    if (!item) return res.status(404).json({ message: 'Plan bulunamadı' });
    await item.update(req.body, { transaction: t });
    await t.commit();
    res.json(item);
  } catch (err) {
    await t.rollback();
    console.error('Update duty schedule failed', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

exports.getRoster = async (req, res) => {
  try {
    const { school_id } = req.params;
    if (!school_id) return res.status(400).json({ message: 'school_id gerekli' });

    // Get all active duty schedules for the school (no day filtering on API side)
    const schedules = await DutySchedule.findAll({
      where: { school_id, is_active: true },
      include: [{
        model: DutyScheduleAssignment,
        as: 'Assignments',
        include: [
          { model: DutyLocation, as: 'DutyLocation' },
          { 
            model: SchoolEmployee, 
            as: 'Employee',
            include: [{ model: EmployeeType, as: 'EmployeeType' }]
          }
        ]
      }],
      order: [['shift', 'ASC'], ['effective_from', 'DESC']]
    });

    // Flatten all assignments into a single roster
    const roster = [];
    schedules.forEach(schedule => {
      if (schedule.Assignments && schedule.Assignments.length > 0) {
        schedule.Assignments.forEach(assignment => {
          roster.push({
            shift: schedule.shift,
            shift_name: schedule.name,
            day_of_week: assignment.day_of_week,
            duty_location: assignment.DutyLocation ? {
              id: assignment.DutyLocation.id,
              name: assignment.DutyLocation.name,
              order: assignment.DutyLocation.order
            } : null,
            employee: assignment.Employee ? {
              id: assignment.Employee.id,
              name: assignment.Employee.name,
              employee_type: assignment.Employee.EmployeeType ? {
                id: assignment.Employee.EmployeeType.id,
                name: assignment.Employee.EmployeeType.name,
                is_vice_principal: assignment.Employee.EmployeeType.is_vice_principal
              } : null
            } : null
          });
        });
      }
    });

    res.json(roster);
  } catch (err) {
    console.error('Get duty roster failed', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};
