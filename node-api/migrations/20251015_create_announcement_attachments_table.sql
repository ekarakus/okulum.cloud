-- Migration: create announcement_attachments table

CREATE TABLE IF NOT EXISTS `announcement_attachments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `announcement_id` INT UNSIGNED NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `path` VARCHAR(512) NOT NULL,
  `mime_type` VARCHAR(100) DEFAULT NULL,
  `size` INT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_ann_attach_ann` (`announcement_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Foreign key constraint (optional, if you want referential integrity)
ALTER TABLE `announcement_attachments`
  ADD CONSTRAINT `fk_ann_attach_announcement` FOREIGN KEY (`announcement_id`) REFERENCES `announcements`(`id`) ON DELETE CASCADE;
