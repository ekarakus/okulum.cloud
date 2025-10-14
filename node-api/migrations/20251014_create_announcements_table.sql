-- Migration: create announcements table
-- Fields: id, school_id, title, content, publish_date, end_date, is_active, created_by, updated_by, created_at, updated_at, ord

CREATE TABLE IF NOT EXISTS `announcements` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `school_id` INT UNSIGNED DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT,
  `publish_date` DATETIME DEFAULT NULL,
  `end_date` DATETIME DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` INT UNSIGNED DEFAULT NULL,
  `updated_by` INT UNSIGNED DEFAULT NULL,
  `ord` INT DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_announcements_school` (`school_id`),
  INDEX `idx_announcements_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
