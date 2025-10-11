const { UserPermission, Permission, UserSchool } = require('../models/relations');
const { sequelize } = require('../models');

// List assigned permission ids for a given user_schools_id
exports.listByUserSchool = async (req, res) => {
  try {
    const userSchoolsId = parseInt(req.params.user_schools_id, 10);
    if (isNaN(userSchoolsId)) return res.status(400).json({ error: 'Invalid id' });

    // Verify the user has access: super_admin or owner of the user_school's school
    const requestingUser = req.user;
    const us = await UserSchool.findByPk(userSchoolsId);
    if (!us) return res.status(404).json({ error: 'Not found' });

    if (requestingUser.role !== 'super_admin') {
      // ensure requestingUser has that user_school (i.e., is assigned to same school)
      const has = await UserSchool.findOne({ where: { user_id: requestingUser.id, school_id: us.school_id } });
      if (!has) return res.status(403).json({ error: 'Forbidden' });
    }

    const rows = await UserPermission.findAll({ where: { user_schools_id: userSchoolsId } });
    const ids = rows.map(r => r.permission_id);
    // also return all available permissions for convenience
    const allPerms = await Permission.findAll({ order: [['name', 'ASC']] });
    res.json({ assigned: ids, all: allPerms });
  } catch (err) {
    console.error('UserPermission list error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Replace assignments for a user_schools_id. Body: { permission_ids: [1,2,3] }
exports.replaceForUserSchool = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userSchoolsId = parseInt(req.params.user_schools_id, 10);
    if (isNaN(userSchoolsId)) return res.status(400).json({ error: 'Invalid id' });

    const permissionIds = Array.isArray(req.body.permission_ids) ? req.body.permission_ids.map(x => parseInt(x, 10)).filter(Boolean) : [];

    const us = await UserSchool.findByPk(userSchoolsId);
    if (!us) { await t.rollback(); return res.status(404).json({ error: 'Not found' }); }

    // Authorization: only super_admin or admins of that school
    const requestingUser = req.user;
    if (requestingUser.role !== 'super_admin') {
      const has = await UserSchool.findOne({ where: { user_id: requestingUser.id, school_id: us.school_id } });
      if (!has) { await t.rollback(); return res.status(403).json({ error: 'Forbidden' }); }
    }

    // Delete existing assignments for this user_schools_id
    await UserPermission.destroy({ where: { user_schools_id: userSchoolsId }, transaction: t });

    if (permissionIds.length > 0) {
      const rows = permissionIds.map(pid => ({ user_schools_id: userSchoolsId, permission_id: pid }));
      await UserPermission.bulkCreate(rows, { transaction: t });
    }

    await t.commit();
    res.json({ success: true });
  } catch (err) {
    await t.rollback();
    console.error('UserPermission replace error', err);
    res.status(500).json({ error: 'Server error' });
  }
};
