require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const config = require('../config');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: (typeof config.getCorsOrigins === 'function' ? config.getCorsOrigins() : config.corsOrigins),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - auth:${req.headers['authorization'] ? 'yes' : 'no'}`);
  next();
});

// Veritabanı ilişkileri
require('./models/relations');


// Auth route
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

// School route
const schoolRouter = require('./routes/schoolRoutes');
app.use('/api/schools', schoolRouter);
// Public school lookup (by code) - used by kiosks and public pages
const publicSchoolRouter = require('./routes/publicSchoolRoutes');
app.use('/api/public/schools', publicSchoolRouter);
// Public routes for kiosk: duty schedules and students
const publicDutyRouter = require('./routes/publicDutyRoutes');
app.use('/api/public/duty-schedule', publicDutyRouter);
const publicStudentRouter = require('./routes/publicStudentRoutes');
app.use('/api/public/students', publicStudentRouter);
// Ensure observances import endpoint is reachable (explicit mount)
const schoolObservancesCtrl = require('./controllers/schoolObservancesController');
const { authenticateToken, checkSchoolAccess } = require('./middleware/auth');
app.post('/api/schools/:school_id/observances/import-from-json', authenticateToken, checkSchoolAccess, schoolObservancesCtrl.importFromJson);
// Location dropdowns (provinces/districts) and uploads
const locationRoutes = require('./routes/locationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api', locationRoutes);
app.use('/api', uploadRoutes);
// Fault-specific uploads (images for fault reports)
const faultUploadRoutes = require('./routes/faultUploadRoutes');
app.use('/api/upload', faultUploadRoutes);

// User route
const userRouter = require('./routes/userRoutes');
app.use('/api/users', userRouter);


// Location route
const locationRouter = require('./routes/location');
app.use('/api/locations', locationRouter);

// Duty locations route (Nöbet Yerleri)
const dutyLocationsRouter = require('./routes/dutyLocations');
app.use('/api/duty_locations', dutyLocationsRouter);


// Device route
const deviceRouter = require('./routes/device');
app.use('/api/devices', deviceRouter);

// DeviceType route
const deviceTypeRouter = require('./routes/deviceType');
app.use('/api/device-types', deviceTypeRouter);

// Technician route
const technicianRouter = require('./routes/technician');
app.use('/api/technicians', technicianRouter);

// Operation route
const operationRouter = require('./routes/operation');
app.use('/api/operations', operationRouter);

// OperationType route
const operationTypeRouter = require('./routes/operationType');
app.use('/api/operation-types', operationTypeRouter);

// Feature route
const featureRouter = require('./routes/feature');
app.use('/api/features', featureRouter);

// Fault reports (Destek Talepleri)
const faultRouter = require('./routes/faultRoutes');
app.use('/api/faults', faultRouter);

// Global settings (super admin)
const globalSettingRouter = require('./routes/globalSetting');
app.use('/api/global-settings', globalSettingRouter);

// Permissions (Yetkiler) - super_admin only
const permissionRouter = require('./routes/permissionRoutes');
app.use('/api/permissions', permissionRouter);

// Admin utility routes
const adminRouter = require('./routes/adminRoutes');
app.use('/api/admin', adminRouter);

// User permissions per user-school
const userPermissionRouter = require('./routes/userPermissionRoutes');
app.use('/api/user-permissions', userPermissionRouter);

// Employee types (super_admin managed)
const employeeTypeRouter = require('./routes/employeeTypeRoutes');
app.use('/api/employee-types', employeeTypeRouter);

// School employees (per-school CRUD)
const schoolEmployeeRouter = require('./routes/schoolEmployeeRoutes');
app.use('/api/school-employees', schoolEmployeeRouter);

// School employees bulk upload
const schoolEmployeeUploadRouter = require('./routes/schoolEmployeeUploadRoutes');
app.use('/api/school-employees/upload', schoolEmployeeUploadRouter);

// School time table (Ders Saatleri)
const schoolTimeTableRouter = require('./routes/schoolTimeTableRoutes');
app.use('/api/school-time-table', schoolTimeTableRouter);

// Duty schedule (Nöbetçi Tablosu)
const dutyScheduleRouter = require('./routes/dutyScheduleRoutes');
app.use('/api/duty-schedule', dutyScheduleRouter);

// Announcements
const announcementRouter = require('./routes/announcementRoutes');
app.use('/api/announcements', announcementRouter);

// Students
const studentRouter = require('./routes/studentRoutes');
app.use('/api/students', studentRouter);

// Info nugget categories & nuggets
const infoNuggetCategoryRouter = require('./routes/infoNuggetCategories');
app.use('/api/info-nugget-categories', infoNuggetCategoryRouter);
const infoNuggetRouter = require('./routes/infoNuggets');
app.use('/api/info-nuggets', infoNuggetRouter);

// Report routes
const reportRouter = require('./routes/report');
app.use('/api/reports', reportRouter);

// Stats route
const statsRouter = require('./routes/stats');
app.use('/api/stats', statsRouter);

// Ana sayfa için bir rota ekleyelim

app.get('/', (req, res) => {
  res.status(200).send('API çalışıyor...!');
});

// No public test routes in production

const PORT = process.env.PORT || 3000;

// Serve uploaded files (attachments, logos, etc.) under /uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

(async () => {
  try {
    // Test database connection first
    const { sequelize } = require('./models/relations');
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Optionally sync the database schema when DB_SYNC=true (opt-in).
    // This prevents accidental schema changes on every server start in production.
    if (process.env.DB_SYNC && process.env.DB_SYNC.toLowerCase() === 'true') {
      try {
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully (DB_SYNC=true)');
      } catch (syncErr) {
        // Some MySQL servers may reject large alter operations (e.g., Too many keys specified)
        if (syncErr && /Too many keys specified/i.test(syncErr.message || '')) {
          console.warn('Database sync (alter) failed due to key/index limits. Continuing without sync.\n', syncErr.message);
        } else {
          throw syncErr;
        }
      }
    } else {
      console.log('DB sync skipped (set DB_SYNC=true to enable automatic sequelize.sync on start)');
    }
  } catch (error) {
    console.error('Database connection/sync error:', error.message);
    // If it's a connection issue, exit. If it's a sync issue already handled above, we don't reach here.
    if (/connect|access|authentication|unable/i.test(error.message)) {
      console.error('Critical DB error, shutting down.');
      process.exit(1);
    } else {
      // Non-critical sync issues were handled; attempt to continue but warn the user.
      console.warn('Continuing to start server despite sync warning.');
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();
