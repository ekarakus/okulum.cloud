-- Create duty_schedule table
CREATE TABLE IF NOT EXISTS duty_schedule (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  shift ENUM('morning','afternoon') NOT NULL,
  effective_from DATE NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_duty_schedule_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: MySQL doesn't support partial unique indexes; we enforce single active per (school_id, shift)
-- using a Sequelize beforeSave hook in the model.

-- Create duty_schedule_assignments table
CREATE TABLE IF NOT EXISTS duty_schedule_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  duty_schedule_id INT NOT NULL,
  day_of_week ENUM('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
  duty_location_id INT NOT NULL,
  school_employee_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dsa_schedule FOREIGN KEY (duty_schedule_id) REFERENCES duty_schedule(id) ON DELETE CASCADE,
  CONSTRAINT fk_dsa_location FOREIGN KEY (duty_location_id) REFERENCES duty_locations(id) ON DELETE CASCADE,
  CONSTRAINT fk_dsa_employee FOREIGN KEY (school_employee_id) REFERENCES school_employees(id) ON DELETE CASCADE,
  INDEX idx_dsa_schedule_day (duty_schedule_id, day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
