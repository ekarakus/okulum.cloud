-- Migration: convert status 'open' -> 'pending' and set table default to 'pending'
-- Safe operations: create backup before running (already present in node-api/backups)

START TRANSACTION;

-- Update existing fault_reports rows to canonical 'pending'
UPDATE fault_reports SET status = 'pending' WHERE status = 'open';

-- Alter table default to 'pending' for fault_reports (MySQL syntax)
ALTER TABLE fault_reports
	MODIFY `status` VARCHAR(32) NOT NULL DEFAULT 'pending';

COMMIT;
