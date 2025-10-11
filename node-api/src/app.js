require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: [
    'http://localhost:4200', 
    'http://localhost:4201', 
    'http://localhost:4204',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
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

// User route
const userRouter = require('./routes/userRoutes');
app.use('/api/users', userRouter);


// Location route
const locationRouter = require('./routes/location');
app.use('/api/locations', locationRouter);


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

// Global settings (super admin)
const globalSettingRouter = require('./routes/globalSetting');
app.use('/api/global-settings', globalSettingRouter);

// Report routes
const reportRouter = require('./routes/report');
app.use('/api/reports', reportRouter);

// Stats route
const statsRouter = require('./routes/stats');
app.use('/api/stats', statsRouter);

// Ana sayfa için bir rota ekleyelim

app.get('/', (req, res) => {
  res.status(200).send('API is healthy and running!');
});

// No public test routes in production

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    // Test database connection first
    const { sequelize } = require('./models/relations');
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Then sync the database
    try {
      await sequelize.sync({ alter: true });
      console.log('Database synced successfully');
    } catch (syncErr) {
      // Some MySQL servers may reject large alter operations (e.g., Too many keys specified)
      if (syncErr && /Too many keys specified/i.test(syncErr.message || '')) {
        console.warn('Database sync (alter) failed due to key/index limits. Continuing without sync.\n', syncErr.message);
      } else {
        throw syncErr;
      }
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
