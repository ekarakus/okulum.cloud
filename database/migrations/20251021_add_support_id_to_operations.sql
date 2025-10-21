-- Add nullable support_id to operations and FK to fault_reports(id)
ALTER TABLE `operations`
  ADD COLUMN `support_id` INT NULL AFTER `school_id`;

-- Add foreign key constraint (if the referenced table exists)
ALTER TABLE `operations`
  ADD CONSTRAINT `operations_support_id_fk` FOREIGN KEY (`support_id`) REFERENCES `fault_reports`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Ensure safe rollback (drop fk then column)
-- To rollback:
-- ALTER TABLE `operations` DROP FOREIGN KEY `operations_support_id_fk`;
-- ALTER TABLE `operations` DROP COLUMN `support_id`;
