const { Device, Feature, DeviceFeature, School } = require('../models/relations');
const { Location, DeviceType } = require('../models/relations');
const QRCode = require('qrcode');

async function generateIdentityNo(location_id, device_type_id) {
  try {
    // Location ve DeviceType bilgilerini al
    const location = await Location.findByPk(location_id);
    const deviceType = await DeviceType.findByPk(device_type_id);
    
    if (!location || !deviceType) {
      throw new Error('Location veya DeviceType bulunamadı');
    }
    
    // Temel kimlik kodu oluştur: room_number + device_code
    const baseCode = `${location.room_number}-${deviceType.device_code}`;
    
    // Bu temel kod ile başlayan kayıtları say
    const existingCount = await Device.count({
      where: {
        identity_no: {
          [require('sequelize').Op.like]: `${baseCode}-%`
        }
      }
    });
    
    // Yeni sıra numarası
    const nextNumber = existingCount + 1;
    
    // Final kimlik no: room_number-device_code-sequence
    return `${baseCode}-${nextNumber}`;
  } catch (error) {
    console.error('Identity No oluşturma hatası:', error);
    // Fallback olarak rastgele kod
    return 'DV-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
}

exports.getAll = async (req, res) => {
  try {
    // Okul filtresi oluştur
    let whereClause = {};
    
    // Super admin değilse sadece kendi okullarındaki cihazları getir
    if (req.userSchools !== null && req.userSchools !== undefined) {
      const schoolIds = req.userSchools.map(us => us.school_id);
      if (schoolIds.length === 0) {
        return res.json([]); // Kullanıcının hiç okulu yoksa boş dön
      }
      whereClause.school_id = schoolIds;
    }
    
    // Query parameter'dan school_id gelirse (okul seçimi)
    if (req.query.school_id) {
      // Kullanıcının bu okula erişimi var mı kontrol et
      if (req.userSchools !== null && req.userSchools !== undefined && !req.userSchools.some(us => us.school_id == req.query.school_id)) {
        return res.status(403).json({ message: 'Bu okula erişim yetkiniz yok' });
      }
      whereClause.school_id = req.query.school_id;
    }
    
    const devices = await Device.findAll({
      where: whereClause,
      include: [
        { model: require('../models/location'), as: 'Location' },
        { model: require('../models/deviceType'), as: 'DeviceType' },
        // Include DeviceFeature through attributes to expose feature values
        { model: Feature, as: 'Features', through: { attributes: ['value'] } },
        { model: School, as: 'School', attributes: ['id', 'name', 'code'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getRecent = async (req, res) => {
  try {
    // Okul filtresi oluştur
    let whereClause = {};
    
    // Super admin değilse sadece kendi okullarındaki verileri getir
    if (req.userSchools !== null && req.userSchools !== undefined) {
      const schoolIds = req.userSchools.map(us => us.school_id);
      if (schoolIds.length === 0) {
        return res.json([]);
      }
      whereClause.school_id = schoolIds;
    }
    
    // Query parameter'dan school_id gelirse
    if (req.query.school_id) {
      if (req.userSchools !== null && req.userSchools !== undefined && !req.userSchools.some(us => us.school_id == req.query.school_id)) {
        return res.status(403).json({ message: 'Bu okula erişim yetkiniz yok' });
      }
      whereClause.school_id = req.query.school_id;
    }

    const devices = await Device.findAll({
      where: whereClause,
      include: [
        { 
          model: require('../models/location'), 
          as: 'Location',
          required: false
        },
        { 
          model: require('../models/deviceType'), 
          as: 'DeviceType',
          required: false
        }
      ],
      order: [['updated_at', 'DESC']],
      limit: 4
    });

    // Basit response formatı (mock/placeholder kullanma)
    const response = devices.map(device => ({
      id: device.id,
      name: device.name ?? null,
      identity_no: device.identity_no ?? null,
      location_name: device.Location 
        ? `${device.Location.name} (${device.Location.room_number})` 
        : null,
      last_operation_date: device.updated_at ?? null
    }));

    res.json(response);
  } catch (error) {
    console.error('Error in getRecent:', error);
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message,
      stack: error.stack 
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const device = await Device.findByPk(id, {
      include: [
        { model: require('../models/location'), as: 'Location' },
        { model: require('../models/deviceType'), as: 'DeviceType' },
        // Include DeviceFeature through attributes to expose feature values
        { model: Feature, as: 'Features', through: { attributes: ['value'] } }
      ]
    });
    
    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }
    
    // QR kod oluştur - URL ile birlikte
    const deviceUrl = `http://localhost:4201/device-detail/${device.id}`;
    const qr_code = await QRCode.toDataURL(deviceUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    res.json({ ...device.toJSON(), qr_code, device_url: deviceUrl });
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    console.log('Device create request body:', req.body);
    const { location_id, device_type_id, selectedFeatures, school_id, ...deviceData } = req.body;
    
    console.log('Extracted data:', { location_id, device_type_id, selectedFeatures, school_id, deviceData });
    
    // School ID kontrolü - eğer frontend'ten gelmemişse location'dan al
    let finalSchoolId = school_id;
    if (!finalSchoolId && location_id) {
      const location = await Location.findByPk(location_id);
      if (location) {
        finalSchoolId = location.school_id;
      }
    }
    
    // Super admin değilse okul erişim kontrolü yap
    if (req.userSchools !== null && req.userSchools !== undefined && finalSchoolId) {
      const hasAccess = req.userSchools.some(us => us.school_id == finalSchoolId);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Bu okula cihaz ekleme yetkiniz yok' });
      }
    }
    
    // Otomatik identity_no oluştur
    const identity_no = await generateIdentityNo(location_id, device_type_id);
    console.log('Generated identity_no:', identity_no);
    
    const device = await Device.create({ 
      ...deviceData,
      location_id,
      device_type_id,
      school_id: finalSchoolId,
      identity_no 
    });
    console.log('Device created:', device.id);
    
    // Eğer features varsa, device-feature ilişkilerini kur (değerleri ile)
    if (selectedFeatures && selectedFeatures.length > 0) {
      console.log('Creating device features (with values):', selectedFeatures);
      const featureData = selectedFeatures
        .map(item => {
          // Geriye dönük uyumluluk: sayıysa sadece feature_id olarak kabul et
          if (typeof item === 'number') {
            return { device_id: device.id, feature_id: item, value: null };
          }
          // Nesne ise beklenen şema: { feature_id, value }
          if (item && typeof item === 'object') {
            const feature_id = item.feature_id || item.id; // id alanı gelirse kabul et
            const value = item.value;
            if (!feature_id) return null;
            // Değer zorunlu olsun
            if (value === undefined || value === null || value === '') {
              throw new Error('Özellik için değer gerekli');
            }
            return { device_id: device.id, feature_id, value };
          }
          return null;
        })
        .filter(Boolean);

      console.log('Feature data to create:', featureData);
      if (featureData.length > 0) {
        await DeviceFeature.bulkCreate(featureData);
        console.log('Device features created');
      }
    }
    
    // Device'ı features ile birlikte geri döndür
    const deviceWithFeatures = await Device.findByPk(device.id, {
      include: [
        { model: require('../models/location'), as: 'Location' },
        { model: require('../models/deviceType'), as: 'DeviceType' },
        { model: Feature, as: 'Features', through: { attributes: ['value'] } }
      ]
    });
    
    // QR kod üret - URL ile birlikte
    const deviceUrl = `http://localhost:4201/device-detail/${device.id}`;
    const qr = await QRCode.toDataURL(deviceUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    res.status(201).json({ ...deviceWithFeatures.toJSON(), qr, device_url: deviceUrl });
  } catch (error) {
    console.error('Device oluşturma hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
  const { selectedFeatures, ...updateData } = req.body;
    const device = await Device.findByPk(id);
    
    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }
    
    // Eğer identity_no güncelleniyor ise benzersizlik kontrolü yap
    if (updateData.identity_no && updateData.identity_no !== device.identity_no) {
      const existingDevice = await Device.findOne({
        where: {
          identity_no: updateData.identity_no,
          id: { [require('sequelize').Op.ne]: id } // Mevcut cihazı hariç tut
        }
      });
      
      if (existingDevice) {
        return res.status(400).json({ 
          error: 'Bu kimlik numarası zaten kullanılıyor' 
        });
      }
    }
    
    // Device bilgilerini güncelle
    await device.update(updateData);
    
    // Features'ları güncelle (değerleri ile)
    if (selectedFeatures !== undefined) {
      // Mevcut device-feature ilişkilerini sil
      await DeviceFeature.destroy({ where: { device_id: id } });

      // Yeni features'ları ekle
      if (selectedFeatures && selectedFeatures.length > 0) {
        const featureData = selectedFeatures
          .map(item => {
            if (typeof item === 'number') {
              return { device_id: id, feature_id: item, value: null };
            }
            if (item && typeof item === 'object') {
              const feature_id = item.feature_id || item.id;
              const value = item.value;
              if (!feature_id) return null;
              if (value === undefined || value === null || value === '') {
                throw new Error('Özellik için değer gerekli');
              }
              return { device_id: id, feature_id, value };
            }
            return null;
          })
          .filter(Boolean);
        if (featureData.length > 0) {
          await DeviceFeature.bulkCreate(featureData);
        }
      }
    }
    
    // Güncellenmiş device'ı features ile birlikte geri döndür
    const updatedDevice = await Device.findByPk(id, {
      include: [
        { model: require('../models/location'), as: 'Location' },
        { model: require('../models/deviceType'), as: 'DeviceType' },
        { model: Feature, as: 'Features', through: { attributes: ['value'] } }
      ]
    });
    
    res.json(updatedDevice);
  } catch (error) {
    console.error('Device güncelleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  const device = await Device.findByPk(id);
  if (!device) return res.status(404).json({ message: 'Cihaz bulunamadı' });
  await device.destroy();
  res.json({ message: 'Silindi' });
};

exports.getQR = async (req, res) => {
  const { id } = req.params;
  const device = await Device.findByPk(id);
  if (!device) return res.status(404).json({ message: 'Cihaz bulunamadı' });
  
  // QR kod üret - URL ile birlikte
  const deviceUrl = `http://localhost:4201/device-detail/${device.id}`;
  const qr = await QRCode.toDataURL(deviceUrl, {
    width: 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
  res.json({ qr, device_url: deviceUrl, identity_no: device.identity_no });
};
