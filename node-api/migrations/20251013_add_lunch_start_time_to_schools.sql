-- Migration: add lunch_start_time column to schools
ALTER TABLE schools
ADD COLUMN lunch_start_time VARCHAR(5) NULL COMMENT 'Öğlen ders başlangıç saati (HH:mm) - nullable';
