const { OperationType } = require('../models/relations');

exports.getAll = async (req, res) => {
  try {
    // Tüm kullanıcılar tüm global operation type'ları görebilir
    const operationTypes = await OperationType.findAll({
      order: [['name', 'ASC']]
    });
    res.json(operationTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const user = req.user;
    
    // Sadece super admin operation type oluşturabilir
    if (user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok. Sadece süper admin operation type oluşturabilir.' });
    }

    const { name, description } = req.body;
    
    const operationType = await OperationType.create({
      name,
      description
    });
    
    res.status(201).json(operationType);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // Sadece super admin operation type güncelleyebilir
    if (user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok. Sadece süper admin operation type güncelleyebilir.' });
    }
    
    const operationType = await OperationType.findByPk(id);
    if (!operationType) {
      return res.status(404).json({ message: 'İşlem türü bulunamadı' });
    }
    
    const { name, description } = req.body;
    
    await operationType.update({
      name,
      description
    });
    
    res.json(operationType);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // Sadece super admin operation type silebilir
    if (user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok. Sadece süper admin operation type silebilir.' });
    }
    
    const operationType = await OperationType.findByPk(id);
    if (!operationType) {
      return res.status(404).json({ message: 'İşlem türü bulunamadı' });
    }
    
    await operationType.destroy();
    res.json({ message: 'İşlem türü başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const operationType = await OperationType.findByPk(id);
    if (!operationType) {
      return res.status(404).json({ message: 'İşlem türü bulunamadı' });
    }
    
    res.json(operationType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};