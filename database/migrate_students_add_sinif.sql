-- Migration: replace 'gender' column with 'class_name' in students table
-- Run this against your MySQL database (make a backup first)

-- WARNING: Make a backup before running these statements.
-- Add new 'class_name' column (varchar(10)). If an older 'sinif' column exists, copy its values into 'class_name' and then drop it.
ALTER TABLE students ADD COLUMN IF NOT EXISTS class_name VARCHAR(10) NULL;

-- If you have a legacy 'sinif' column, copy values into 'class_name' and then drop 'sinif'
-- UPDATE students SET class_name = sinif WHERE class_name IS NULL;
-- ALTER TABLE students DROP COLUMN sinif;

-- Optionally drop the 'gender' column if present
-- ALTER TABLE students DROP COLUMN gender;

-- After running, verify the schema manually using your DB tools.
