const { DeviceType } = require('../models/relations');

exports.getAll = async (req, res) => {
  try {
    // Tüm kullanıcılar tüm global device type'ları görebilir
    const deviceTypes = await DeviceType.findAll({
      order: [['name', 'ASC']]
    });
    res.json(deviceTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const user = req.user;
    
    // Sadece super admin device type oluşturabilir
    if (user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok. Sadece süper admin device type oluşturabilir.' });
    }

    const { name, device_code, description } = req.body;
    
    const deviceType = await DeviceType.create({
      name,
      device_code,
      description
    });
    
    res.status(201).json(deviceType);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // Sadece super admin device type güncelleyebilir
    if (user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok. Sadece süper admin device type güncelleyebilir.' });
    }
    
    const deviceType = await DeviceType.findByPk(id);
    if (!deviceType) {
      return res.status(404).json({ message: 'Aygıt tipi bulunamadı' });
    }
    
    const { name, device_code, description } = req.body;
    
    await deviceType.update({
      name,
      device_code,
      description
    });
    
    res.json(deviceType);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // Sadece super admin device type silebilir
    if (user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok. Sadece süper admin device type silebilir.' });
    }
    
    const deviceType = await DeviceType.findByPk(id);
    if (!deviceType) {
      return res.status(404).json({ message: 'Aygıt tipi bulunamadı' });
    }
    
    await deviceType.destroy();
    res.json({ message: 'Aygıt tipi başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};