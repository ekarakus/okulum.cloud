-- Allow duty_location_id to be NULL for duty_schedule_assignments (assistants may not have a location)
ALTER TABLE duty_schedule_assignments
  MODIFY COLUMN duty_location_id INT NULL;
