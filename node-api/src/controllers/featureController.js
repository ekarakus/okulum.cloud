const Feature = require('../models/feature');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    const features = await Feature.findAll({
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });
    res.json(features);
  } catch (error) {
    console.error('Error fetching features:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const feature = await Feature.findByPk(id);
    if (!feature) return res.status(404).json({ message: 'Özellik bulunamadı' });
    res.json(feature);
  } catch (error) {
    console.error('Error fetching feature:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const user = req.user;
    
    // Sadece super admin feature oluşturabilir
    if (user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok. Sadece süper admin feature oluşturabilir.' });
    }

  const { name, description, sort_order } = req.body;
    
    // Check if name already exists
    const existingFeature = await Feature.findOne({ where: { name } });
    if (existingFeature) {
      return res.status(400).json({ message: 'Bu özellik adı zaten kullanılıyor' });
    }
    
  const parsedOrder = parseInt(sort_order, 10);
  const orderValue = Number.isFinite(parsedOrder) ? parsedOrder : 0;

    const feature = await Feature.create({
      name: name.trim(),
      description: description ? description.trim() : null,
  sort_order: orderValue
    });
    res.status(201).json(feature);
  } catch (error) {
    console.error('Error creating feature:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const user = req.user;
    
    // Sadece super admin feature güncelleyebilir
    if (user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok. Sadece süper admin feature güncelleyebilir.' });
    }

    const { id } = req.params;
  const { name, description, sort_order } = req.body;
    
    const feature = await Feature.findByPk(id);
    if (!feature) return res.status(404).json({ message: 'Özellik bulunamadı' });
    
    // Check if name already exists (exclude current feature)
    if (name && name !== feature.name) {
      const existingFeature = await Feature.findOne({ 
        where: { 
          name,
          id: { [Op.ne]: id }
        } 
      });
      if (existingFeature) {
        return res.status(400).json({ message: 'Bu özellik adı zaten kullanılıyor' });
      }
    }
    
  const parsedOrder = parseInt(sort_order, 10);
  const orderValue = Number.isFinite(parsedOrder) ? parsedOrder : feature.sort_order;

    await feature.update({
      name: name ? name.trim() : feature.name,
      description: description !== undefined ? (description ? description.trim() : null) : feature.description,
  sort_order: orderValue
    });
    
    res.json(feature);
  } catch (error) {
    console.error('Error updating feature:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const user = req.user;
    
    // Sadece super admin feature silebilir
    if (user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok. Sadece süper admin feature silebilir.' });
    }

    const { id } = req.params;
    const feature = await Feature.findByPk(id);
    if (!feature) return res.status(404).json({ message: 'Özellik bulunamadı' });
    
    await feature.destroy();
    res.json({ message: 'Özellik başarıyla silindi' });
  } catch (error) {
    console.error('Error deleting feature:', error);
    res.status(500).json({ error: error.message });
  }
};