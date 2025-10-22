-- Rename user_id to created_by_user_id and add requested_by_employee_id nullable
START TRANSACTION;

-- If user_id column exists, rename it
ALTER TABLE `fault_reports`
  CHANGE COLUMN `user_id` `created_by_user_id` INT NOT NULL;

-- Add requested_by_employee_id column nullable
ALTER TABLE `fault_reports`
  ADD COLUMN `requested_by_employee_id` INT NULL AFTER `device_id`;

-- Optionally add foreign key if school_employees table exists
ALTER TABLE `fault_reports`
  ADD CONSTRAINT `fk_fault_reports_requested_by_employee`
  FOREIGN KEY (`requested_by_employee_id`) REFERENCES `school_employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;