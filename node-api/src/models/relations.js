const { sequelize, createDatabase } = require('./index');
const Location = require('./location');
const Device = require('./Device');
const DeviceType = require('./deviceType');
const OperationType = require('./operationType');
const Operation = require('./operation');
const User = require('./user');
const Technician = require('./technician');
const Feature = require('./feature');
const DeviceFeature = require('./deviceFeature');
const School = require('./school');
const UserSchool = require('./userSchool');
const UserPermission = require('./userPermission');
const Permission = require('./permission');
const EmployeeType = require('./employeeType');
const SchoolEmployee = require('./schoolEmployee');

// İlişkiler
Location.hasMany(Device, { foreignKey: 'location_id', as: 'Location' });
Device.belongsTo(Location, { foreignKey: 'location_id', as: 'Location' });

DeviceType.hasMany(Device, { foreignKey: 'device_type_id', as: 'DeviceType' });
Device.belongsTo(DeviceType, { foreignKey: 'device_type_id', as: 'DeviceType' });

// Device ve Operation ilişkileri
Device.hasMany(Operation, { foreignKey: 'device_id', as: 'Operations' });
Operation.belongsTo(Device, { foreignKey: 'device_id', as: 'Device' });

OperationType.hasMany(Operation, { foreignKey: 'operation_type_id', as: 'Operations' });
Operation.belongsTo(OperationType, { foreignKey: 'operation_type_id', as: 'OperationType' });

Technician.hasMany(Operation, { foreignKey: 'technician_id', as: 'Operations' });
Operation.belongsTo(Technician, { foreignKey: 'technician_id', as: 'Technician' });

// Device ve Feature many-to-many ilişkisi
Device.belongsToMany(Feature, { 
  through: DeviceFeature, 
  foreignKey: 'device_id',
  otherKey: 'feature_id',
  as: 'Features'
});
Feature.belongsToMany(Device, { 
  through: DeviceFeature, 
  foreignKey: 'feature_id',
  otherKey: 'device_id',
  as: 'Devices'
});

// DeviceFeature junction table ilişkileri
DeviceFeature.belongsTo(Device, { foreignKey: 'device_id' });
DeviceFeature.belongsTo(Feature, { foreignKey: 'feature_id' });
Device.hasMany(DeviceFeature, { foreignKey: 'device_id' });
Feature.hasMany(DeviceFeature, { foreignKey: 'feature_id' });

// School İlişkileri
School.hasMany(Device, { foreignKey: 'school_id', as: 'Devices' });
Device.belongsTo(School, { foreignKey: 'school_id', as: 'School' });

School.hasMany(Location, { foreignKey: 'school_id', as: 'Locations' });
Location.belongsTo(School, { foreignKey: 'school_id', as: 'School' });

School.hasMany(Technician, { foreignKey: 'school_id', as: 'Technicians' });
Technician.belongsTo(School, { foreignKey: 'school_id', as: 'School' });

School.hasMany(Operation, { foreignKey: 'school_id', as: 'Operations' });
Operation.belongsTo(School, { foreignKey: 'school_id', as: 'School' });

// User-School Many-to-Many İlişkisi
User.belongsToMany(School, { 
  through: UserSchool, 
  foreignKey: 'user_id', 
  otherKey: 'school_id',
  as: 'schools' 
});

School.belongsToMany(User, { 
  through: UserSchool, 
  foreignKey: 'school_id', 
  otherKey: 'user_id',
  as: 'users' 
});

// UserSchool direct associations
UserSchool.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
UserSchool.belongsTo(School, { foreignKey: 'school_id', as: 'School' });
User.hasMany(UserSchool, { foreignKey: 'user_id', as: 'UserSchools' });
School.hasMany(UserSchool, { foreignKey: 'school_id', as: 'UserSchools' });
// School employees
School.hasMany(SchoolEmployee, { foreignKey: 'school_id', as: 'Employees' });
SchoolEmployee.belongsTo(School, { foreignKey: 'school_id', as: 'School' });

// EmployeeType relations
EmployeeType.hasMany(SchoolEmployee, { foreignKey: 'employee_type_id', as: 'Employees' });
SchoolEmployee.belongsTo(EmployeeType, { foreignKey: 'employee_type_id', as: 'EmployeeType' });

module.exports = {
  sequelize,
  createDatabase,
  Location,
  Device,
  DeviceType,
  OperationType,
  Operation,
  User,
  Technician,
  Feature,
  DeviceFeature,
  School,
  UserSchool,
  UserPermission,
  Permission,
  EmployeeType,
  SchoolEmployee,
};
