ALTER TABLE devices
  ADD user_id INT NULL;

ALTER TABLE devices
  ADD user_is_employee TINYINT NOT NULL DEFAULT 0;

ALTER TABLE devices
  ADD CONSTRAINT fk_devices_user_id
  FOREIGN KEY (user_id) REFERENCES school_employees(id) ON DELETE SET NULL;

CREATE INDEX idx_devices_user_id ON devices(user_id);
