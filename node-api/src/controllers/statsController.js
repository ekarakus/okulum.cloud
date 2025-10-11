const { Operation, Device, DeviceType, Location, Technician, Feature, School } = require('../models/relations');
const { Op } = require('sequelize');

exports.getDashboardStats = async (req, res) => {
  try {
    // Okul filtresi oluştur
    let whereClause = {};
    
    // Super admin değilse sadece kendi okullarındaki verileri getir
    if (req.userSchools !== null && req.userSchools !== undefined) {
      const schoolIds = req.userSchools.map(us => us.school_id);
      if (schoolIds.length === 0) {
        return res.json({
          overview: {
            totalDevices: 0,
            totalOperations: 0,
            completedOperations: 0,
            pendingOperations: 0,
            completedLast7Days: 0,
            completedLast30Days: 0,
            operationsLast7Days: 0,
            operationsLast30Days: 0
          }
        });
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

    // Bugünden itibaren son 7 ve 30 gün
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Toplam sayılar (okul filtresi ile)
    const totalDevices = await Device.count({ where: whereClause });
    const totalOperations = await Operation.count({ where: whereClause });

    // Tamamlanan vs bekleyen işlemler (okul filtresi ile)
    const completedOperations = await Operation.count({
      where: { ...whereClause, is_completed: true }
    });
    const pendingOperations = await Operation.count({
      where: { ...whereClause, is_completed: false }
    });

    // Son 7 gün içinde tamamlanan işlemler (okul filtresi ile)
    const completedLast7Days = await Operation.count({
      where: {
        ...whereClause,
        is_completed: true,
        created_at: {
          [Op.gte]: last7Days
        }
      }
    });

    // Son 30 gün içinde tamamlanan işlemler
    const completedLast30Days = await Operation.count({
      where: {
        ...whereClause,
        is_completed: true,
        created_at: {
          [Op.gte]: last30Days
        }
      }
    });

    // Son 7 gün işlemler (tüm işlemler - okul filtresi ile)
    const operationsLast7Days = await Operation.count({
      where: {
        ...whereClause,
        created_at: {
          [Op.gte]: last7Days
        }
      }
    });

    // Son 30 gün işlemler (tüm işlemler - okul filtresi ile)
    const operationsLast30Days = await Operation.count({
      where: {
        ...whereClause,
        created_at: {
          [Op.gte]: last30Days
        }
      }
    });

    const stats = {
      overview: {
        totalDevices,
        totalOperations,
        completedOperations,
        pendingOperations,
        completedLast7Days,
        completedLast30Days,
        operationsLast7Days,
        operationsLast30Days
      },
      charts: {
        operationStatus: {
          completed: completedOperations,
          pending: pendingOperations
        },
        recentActivity: {
          completedLast7Days,
          completedLast30Days,
          operationsLast7Days,
          operationsLast30Days
        }
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
};