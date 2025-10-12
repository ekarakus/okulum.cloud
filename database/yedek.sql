-- --------------------------------------------------------
-- Sunucu:                       yamanote.proxy.rlwy.net
-- Sunucu sürümü:                9.4.0 - MySQL Community Server - GPL
-- Sunucu İşletim Sistemi:       Linux
-- HeidiSQL Sürüm:               12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- tablo yapısı dökülüyor railway.devices
DROP TABLE IF EXISTS `devices`;
CREATE TABLE IF NOT EXISTS `devices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `identity_no` varchar(255) COLLATE utf8mb4_tr_0900_ai_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_tr_0900_ai_ci NOT NULL,
  `serial_no` varchar(255) COLLATE utf8mb4_tr_0900_ai_ci DEFAULT NULL,
  `user` varchar(255) COLLATE utf8mb4_tr_0900_ai_ci DEFAULT NULL,
  `status` enum('active','inactive','maintenance') COLLATE utf8mb4_tr_0900_ai_ci DEFAULT 'active',
  `location_id` int NOT NULL,
  `device_type_id` int NOT NULL,
  `school_id` int NOT NULL COMMENT 'Cihaz??n ait oldu??u okul',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `remark` text COLLATE utf8mb4_tr_0900_ai_ci COMMENT 'Cihaz ile ilgili açıklama / not alanı',
  PRIMARY KEY (`id`),
  UNIQUE KEY `identity_no` (`identity_no`),
  
  KEY `location_id` (`location_id`),
  KEY `device_type_id` (`device_type_id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `devices_ibfk_95` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `devices_ibfk_96` FOREIGN KEY (`device_type_id`) REFERENCES `device_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `devices_ibfk_97` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_tr_0900_ai_ci;

-- railway.devices: ~8 rows (yaklaşık) tablosu için veriler indiriliyor
INSERT INTO `devices` (`id`, `identity_no`, `name`, `serial_no`, `user`, `status`, `location_id`, `device_type_id`, `school_id`, `created_at`, `updated_at`, `remark`) VALUES
	(7, '126-AIO-1', 'Lab Öğretmen Bilgisayarı', '', 'Ergün KARAKUŞ', 'active', 6, 14, 1, '2025-10-06 10:27:59', '2025-10-08 09:31:07', ''),
	(8, '126-AKT-1', 'BT Lab Tahtas??', '', '', 'active', 6, 6, 1, '2025-10-06 10:52:51', '2025-10-06 10:52:51', NULL),
	(9, '126-AIO-2', 'LAB PC 1', '', '', 'active', 6, 14, 1, '2025-10-06 11:00:37', '2025-10-06 11:06:12', NULL),
	(10, '129-DSK-1', 'Memur1', '', 'Hazel Başaran', 'active', 13, 1, 1, '2025-10-06 11:10:10', '2025-10-06 11:10:10', NULL),
	(11, '129-DSK-2', 'Memur2', '', 'G??lnur G??r??l', 'active', 13, 1, 1, '2025-10-06 11:10:20', '2025-10-06 11:11:37', NULL),
	(12, '128-AIO-1', 'Müdür Bilgisayarı', '', 'Kemal KILIÇ', 'active', 12, 14, 1, '2025-10-06 11:27:31', '2025-10-07 11:38:42', ''),
	(13, '129-YZC-1', 'Memur Yaz??c?? 1', '', 'Hazel Ba??aran', 'active', 13, 5, 1, '2025-10-06 11:42:00', '2025-10-06 11:42:00', NULL),
	(14, '131-DSK-1', 'ESK?? PC 1', '', '', 'inactive', 41, 1, 1, '2025-10-06 11:47:17', '2025-10-07 07:17:24', 'a????lm??yor');

-- tablo yapısı dökülüyor railway.device_features
DROP TABLE IF EXISTS `device_features`;
CREATE TABLE IF NOT EXISTS `device_features` (
  `id` int NOT NULL AUTO_INCREMENT,
  `device_id` int NOT NULL,
  `feature_id` int NOT NULL,
  `value` varchar(255) COLLATE utf8mb4_tr_0900_ai_ci DEFAULT NULL COMMENT 'Özellik değeri',
  PRIMARY KEY (`id`),
  UNIQUE KEY `device_features_feature_id_device_id_unique` (`device_id`,`feature_id`),
  KEY `feature_id` (`feature_id`),
  CONSTRAINT `device_features_ibfk_59` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `device_features_ibfk_60` FOREIGN KEY (`feature_id`) REFERENCES `features` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_tr_0900_ai_ci;

-- railway.device_features: ~27 rows (yaklaşık) tablosu için veriler indiriliyor
INSERT INTO `device_features` (`id`, `device_id`, `feature_id`, `value`) VALUES
	(54, 9, 5, 'Dell'),
	(55, 9, 6, '8GB'),
	(56, 9, 7, '??3 14100'),
	(57, 9, 9, '238GB'),
	(58, 9, 10, '23.8'),
	(59, 9, 11, 'W11'),
	(60, 9, 12, 'Optiplex 7420'),
	(61, 9, 13, '128MB'),
	(68, 11, 6, '4GB'),
	(69, 11, 11, 'W10'),
	(70, 8, 6, '4GB'),
	(71, 8, 14, 'FAZ1'),
	(73, 10, 6, '8GB'),
	(74, 10, 11, 'W11'),
	(75, 10, 15, 'Kycera'),
	(76, 13, 5, 'hp'),
	(77, 13, 12, 'P1100'),
	(81, 14, 8, 'BOZUK'),
	(82, 12, 6, '4GB'),
	(83, 7, 5, 'Dell'),
	(84, 7, 13, '128MB'),
	(85, 7, 12, 'Optiplex 7420'),
	(86, 7, 11, 'W11'),
	(87, 7, 10, '23.8'),
	(88, 7, 9, '238GB'),
	(89, 7, 7, '??3 14100'),
	(90, 7, 6, '8GB');

-- tablo yapısı dökülüyor railway.device_types
DROP TABLE IF EXISTS `device_types`;
CREATE TABLE IF NOT EXISTS `device_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_tr_0900_ai_ci NOT NULL,
  `device_code` varchar(10) COLLATE utf8mb4_tr_0900_ai_ci NOT NULL,
  `description` text COLLATE utf8mb4_tr_0900_ai_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_tr_0900_ai_ci;

-- railway.device_types: ~12 rows (yaklaşık) tablosu için veriler indiriliyor
INSERT INTO `device_types` (`id`, `name`, `device_code`, `description`) VALUES
	(1, 'Masaüstü Bilgisayar', 'DSK', 'Standart masaüstü bilgisayarlar'),
	(2, 'Laptop', 'LPT', 'Taşınabilir bilgisayarlar'),
	(3, 'Tablet', 'TBL', 'Dokunmatik tablet cihazları'),
	(4, 'Projeksiyon', 'PRJ', 'Sunum için projeksiyon cihazı'),
	(5, 'SB Lazer Yazıcı', 'SLY', 'Siyah Beyaz Lazer Yazıcı'),
	(6, 'Akıllı Tahta', 'AKT', 'Etkileşimli tahta / akıllı tahta'),
	(8, 'Erişim Noktası', 'ERN', 'Kablosuz erişim noktası (Access Point)'),
	(12, 'Tarayıcı', 'TRY', 'Doküman tarayıcı'),
	(13, 'Projeksiyon Perde', 'PRP', 'Projeksiyon perdeleri '),
	(14, 'Hepsi Bir Arada', 'AIO', 'Monitör ve Kasa Bilgisayar'),
	(15, 'Renkli Lazer Yazıcı', 'RLY', 'Renkli Lazer Yazıcı'),
	(16, 'Çok Fonksiyonlu Yazıcı', 'FYZ', 'Yazıcı Tarayıcı Özelliği olan yazıcı');

-- tablo yapısı dökülüyor railway.features
DROP TABLE IF EXISTS `features`;
CREATE TABLE IF NOT EXISTS `features` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_tr_0900_ai_ci;

-- railway.features: ~11 rows (yaklaşık) tablosu için veriler indiriliyor
INSERT INTO `features` (`id`, `name`, `description`, `sort_order`) VALUES
	(5, 'Marka', 'Cihazın markası', 4),
	(6, 'Ram', 'Bellek kapasitesi (GB)', 2),
	(7, 'İşlemci', 'İşlemci modeli ve hızı', 1),
	(8, 'Anakart', 'Anakart modeli', 9),
	(9, 'Depolama', 'HDD/SSD kapasitesi', 3),
	(10, 'Ekran Boyutu', 'Ekran boyutu', 8),
	(11, 'İşletim Sistemi', 'Yüklü işletim sistemi', 6),
	(12, 'Model', 'Cihazın modeli', 5),
	(13, 'Ekran Kartı', 'Ekran Kartı bilgileri', 7),
	(14, 'Dağıtım Sürümü', NULL, 10),
	(15, 'Yazıcı Modeli', NULL, 11);

-- tablo yapısı dökülüyor railway.global_settings
DROP TABLE IF EXISTS `global_settings`;
CREATE TABLE IF NOT EXISTS `global_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `smtp_host` varchar(255) COLLATE utf8mb4_tr_0900_ai_ci DEFAULT NULL,
  `smtp_port` int DEFAULT NULL,
  `smtp_secure` tinyint(1) DEFAULT '0',
  `smtp_user` varchar(255) COLLATE utf8mb4_tr_0900_ai_ci DEFAULT NULL,
  `smtp_password` varchar(255) COLLATE utf8mb4_tr_0900_ai_ci DEFAULT NULL,
  `from_email` varchar(255) COLLATE utf8mb4_tr_0900_ai_ci DEFAULT NULL,
  `from_name` varchar(255) COLLATE utf8mb4_tr_0900_ai_ci DEFAULT NULL,
  `provider` varchar(255) COLLATE utf8mb4_tr_0900_ai_ci DEFAULT NULL COMMENT 'gmail | custom | other',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_tr_0900_ai_ci;

-- railway.global_settings: ~0 rows (yaklaşık) tablosu için veriler indiriliyor

-- tablo yapısı dökülüyor railway.locations
DROP TABLE IF EXISTS `locations`;
CREATE TABLE IF NOT EXISTS `locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_tr_0900_ai_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_tr_0900_ai_ci DEFAULT NULL,
  `room_number` varchar(255) COLLATE utf8mb4_tr_0900_ai_ci DEFAULT NULL,
  `school_id` int NOT NULL COMMENT 'Lokasyonun ait oldu??u okul',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `locations_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_tr_0900_ai_ci;

-- railway.locations: ~36 rows (yaklaşık) tablosu için veriler indiriliyor
INSERT INTO `locations` (`id`, `name`, `description`, `room_number`, `school_id`, `created_at`, `updated_at`) VALUES
	(6, 'Bilişim Sınıfı', '', '126', 1, '2025-10-06 07:19:27', '2025-10-08 09:31:33'),
	(7, 'Öğretmenler Odası', '', '127', 1, '2025-10-06 07:19:44', '2025-10-07 11:37:39'),
	(8, 'M??zik Odas??', '', 'Z01', 1, '2025-10-06 07:52:41', '2025-10-06 07:52:41'),
	(9, 'Konferans Salonu', '', 'Z07', 1, '2025-10-06 07:53:01', '2025-10-06 07:53:01'),
	(10, 'Rehberlik Servisi', '', 'Z12', 1, '2025-10-06 07:53:22', '2025-10-06 07:53:22'),
	(11, 'Okul Aile Birli??i', '', 'Z10', 1, '2025-10-06 07:53:35', '2025-10-06 07:53:35'),
	(12, 'M??d??r Odas??', '', '128', 1, '2025-10-06 07:54:24', '2025-10-06 07:54:24'),
	(13, 'Memur Odas??', '', '129', 1, '2025-10-06 07:54:36', '2025-10-06 07:54:36'),
	(14, 'Destek1', '', '125', 1, '2025-10-06 10:02:38', '2025-10-06 10:02:38'),
	(15, 'Destek2', '', '124', 1, '2025-10-06 10:02:49', '2025-10-06 10:02:49'),
	(16, 'M??d??r Yard??mc??s??', '', '123', 1, '2025-10-06 10:03:18', '2025-10-06 10:03:18'),
	(17, '11B/9B', '', '252', 1, '2025-10-06 10:04:07', '2025-10-06 10:04:07'),
	(18, '11A/9A', '', '251', 1, '2025-10-06 10:04:54', '2025-10-06 10:04:54'),
	(19, '11C/9C', '', '250', 1, '2025-10-06 10:05:08', '2025-10-06 10:05:08'),
	(20, '11D/9D', '', '249', 1, '2025-10-06 10:05:23', '2025-10-06 10:05:23'),
	(21, '11E/9E', '', '247', 1, '2025-10-06 10:06:07', '2025-10-06 10:06:07'),
	(22, '11F/9F', '', '246', 1, '2025-10-06 10:06:19', '2025-10-06 10:06:19'),
	(23, '11G/9G', '', '245', 1, '2025-10-06 10:06:39', '2025-10-06 10:06:39'),
	(24, 'Resim At??lyesi', '', '248', 1, '2025-10-06 10:06:57', '2025-10-06 10:06:57'),
	(25, '12I', '', '243', 1, '2025-10-06 10:18:56', '2025-10-06 10:18:56'),
	(26, '12İ', '', '242', 1, '2025-10-06 10:19:09', '2025-10-07 11:37:47'),
	(27, 'M??d??r Yard??mc??s??', '', '244', 1, '2025-10-06 10:19:31', '2025-10-06 10:19:31'),
	(28, '12B/10B', '', '373', 1, '2025-10-06 10:20:06', '2025-10-06 10:20:06'),
	(29, '12A/10A', '', '374', 1, '2025-10-06 10:20:25', '2025-10-06 10:20:25'),
	(30, '12C/10C', '', '371', 1, '2025-10-06 10:20:37', '2025-10-06 10:20:37'),
	(31, '12D/10D', '', '370', 1, '2025-10-06 10:20:44', '2025-10-06 10:20:44'),
	(32, '12E/10E', '', '368', 1, '2025-10-06 10:21:05', '2025-10-06 10:21:05'),
	(33, '12F/10F', '', '367', 1, '2025-10-06 10:21:34', '2025-10-06 10:21:34'),
	(34, '12G/10G', '', '366', 1, '2025-10-06 10:21:45', '2025-10-06 10:21:45'),
	(35, '12H', '', '363', 1, '2025-10-06 10:22:30', '2025-10-06 10:25:47'),
	(36, 'Destek 3', '', '301', 1, '2025-10-06 10:22:46', '2025-10-06 10:22:46'),
	(37, '1.Kat Koridoru', '', 'KT1', 1, '2025-10-06 10:49:13', '2025-10-06 10:49:13'),
	(38, '2.Kat Koridoru', '', 'KT2', 1, '2025-10-06 10:49:31', '2025-10-06 10:49:31'),
	(39, '3.Kat Koridoru', '', 'KT3', 1, '2025-10-06 10:49:40', '2025-10-06 10:49:40'),
	(40, 'Zemin Koridoru', '', 'KTZ', 1, '2025-10-06 10:50:26', '2025-10-06 10:50:26'),
	(41, 'Ar??iv', 'Ar??iv Odas?? Depo', '131', 1, '2025-10-06 11:44:57', '2025-10-06 11:44:57');

-- tablo yapısı dökülüyor railway.operations
DROP TABLE IF EXISTS `operations`;
CREATE TABLE IF NOT EXISTS `operations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `operation_type_id` int NOT NULL,
  `description` text COLLATE utf8mb4_tr_0900_ai_ci,
  `date` datetime DEFAULT NULL,
  `technician_id` int NOT NULL,
  `device_id` int NOT NULL,
  `is_completed` tinyint(1) DEFAULT '0',
  `school_id` int NOT NULL COMMENT '????lemin ait oldu??u okul',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `operation_type_id` (`operation_type_id`),
  KEY `technician_id` (`technician_id`),
  KEY `device_id` (`device_id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `operations_ibfk_127` FOREIGN KEY (`operation_type_id`) REFERENCES `operation_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `operations_ibfk_128` FOREIGN KEY (`technician_id`) REFERENCES `technicians` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `operations_ibfk_129` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `operations_ibfk_130` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_tr_0900_ai_ci;

-- railway.operations: ~3 rows (yaklaşık) tablosu için veriler indiriliyor
INSERT INTO `operations` (`id`, `operation_type_id`, `description`, `date`, `technician_id`, `device_id`, `is_completed`, `school_id`, `created_at`, `updated_at`) VALUES
	(4, 3, NULL, '2025-09-28 21:00:00', 3, 7, 1, 1, '2025-10-06 10:47:21', '2025-10-06 10:47:21'),
	(5, 6, NULL, '2025-09-28 21:00:00', 3, 11, 1, 1, '2025-10-06 11:12:14', '2025-10-06 11:12:14'),
	(6, 2, NULL, '2025-09-28 21:00:00', 3, 11, 1, 1, '2025-10-06 11:12:35', '2025-10-06 11:12:35');

-- tablo yapısı dökülüyor railway.operation_types
DROP TABLE IF EXISTS `operation_types`;
CREATE TABLE IF NOT EXISTS `operation_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_tr_0900_ai_ci NOT NULL,
  `description` text COLLATE utf8mb4_tr_0900_ai_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_tr_0900_ai_ci;

-- railway.operation_types: ~13 rows (yaklaşık) tablosu için veriler indiriliyor
INSERT INTO `operation_types` (`id`, `name`, `description`) VALUES
	(1, 'BIOS Pili Değişimi', NULL),
	(2, 'Windows 10 Kurulumu', NULL),
	(3, 'Windows 11 Kurulumu', NULL),
	(4, 'Kasa Toz Temizliği', NULL),
	(5, 'Virus Taraması', NULL),
	(6, 'Harddisk Değişimi (SSD)', NULL),
	(7, 'Ram Değişimi', NULL),
	(8, 'Ram Takviyesi', NULL),
	(10, 'Ağ Yapılandırması', NULL),
	(11, 'Yedekleme', NULL),
	(12, 'Yazılım Güncellemesi', NULL),
	(16, 'Temizlik', NULL),
	(17, 'Termal Macun Değişikliği', NULL);

-- tablo yapısı dökülüyor railway.schools
DROP TABLE IF EXISTS `schools`;
CREATE TABLE IF NOT EXISTS `schools` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_tr_0900_ai_ci NOT NULL COMMENT 'Okul adı',
  `code` varchar(10) COLLATE utf8mb4_tr_0900_ai_ci NOT NULL COMMENT 'Okul kodu (örn: AKM001)',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_tr_0900_ai_ci;

-- railway.schools: ~1 rows (yaklaşık) tablosu için veriler indiriliyor
INSERT INTO `schools` (`id`, `name`, `code`, `created_at`, `updated_at`) VALUES
	(1, 'Avcılar Anadolu Lisesi', 'AAL', '2025-10-06 07:00:24', '2025-10-07 09:43:14');

-- tablo yapısı dökülüyor railway.technicians
DROP TABLE IF EXISTS `technicians`;
CREATE TABLE IF NOT EXISTS `technicians` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_tr_0900_ai_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_tr_0900_ai_ci DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_tr_0900_ai_ci DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_tr_0900_ai_ci DEFAULT 'active',
  `school_id` int NOT NULL COMMENT 'Teknisyenin ait oldu??u okul',
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `technicians_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_tr_0900_ai_ci;

-- railway.technicians: ~2 rows (yaklaşık) tablosu için veriler indiriliyor
INSERT INTO `technicians` (`id`, `name`, `email`, `phone`, `status`, `school_id`) VALUES
	(3, 'Ergün Karakuş', 'ekarakus@btofis.com', '5305241200', 'active', 1),
	(4, 'Hazel Başaran', '', '', 'active', 1);

-- tablo yapısı dökülüyor railway.users
DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_tr_0900_ai_ci NOT NULL,
  `role` enum('super_admin','admin') COLLATE utf8mb4_tr_0900_ai_ci DEFAULT 'admin' COMMENT 'super_admin: Sistem yöneticisi, admin: Okul yöneticisi',
  `email` varchar(255) COLLATE utf8mb4_tr_0900_ai_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_tr_0900_ai_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1' COMMENT 'Kullanıcı aktif mi?',
  `last_login` datetime DEFAULT NULL COMMENT 'Son giriş tarihi',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_tr_0900_ai_ci;

-- railway.users: ~3 rows (yaklaşık) tablosu için veriler indiriliyor
INSERT INTO `users` (`id`, `name`, `role`, `email`, `password`, `is_active`, `last_login`, `created_at`, `updated_at`) VALUES
	(2, 'E. Karaku??', 'super_admin', 'ekarakus@btofis.com', '$2b$10$72/MtpHt7A9sqHdXjsQVL.bTluzkbpRyXvVb/zDd1Rv1Vg.S36KAC', 1, '2025-10-08 15:03:36', '2025-10-06 06:58:54', '2025-10-08 15:03:36'),
	(3, 'saide kullan??c??', 'admin', 'saide@gmail.com', '$2b$10$D/FZkG8W7x85JDDGIypFPuQUzBGhHRFFnZWldHlC3doddJ3ViFc7y', 1, NULL, '2025-10-06 07:02:16', '2025-10-06 07:02:16'),
	(4, 'Hazel BAŞARAN', 'admin', 'hazellbasaran@gmail.com', '$2b$10$hH8uPlJAEQk7QE8U0ezp3ukzNivfkOZsvWzYvTQ9dCrUme8Mu.ThS', 1, NULL, '2025-10-06 07:02:46', '2025-10-07 12:33:11');

-- tablo yapısı dökülüyor railway.user_schools
DROP TABLE IF EXISTS `user_schools`;
CREATE TABLE IF NOT EXISTS `user_schools` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `school_id` int NOT NULL,
  `is_primary` tinyint(1) DEFAULT '0' COMMENT 'Kullanıcının ana okulu mu?',
  `assigned_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_schools_school_id_user_id_unique` (`user_id`,`school_id`),
  UNIQUE KEY `user_schools_user_id_school_id` (`user_id`,`school_id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `user_schools_ibfk_55` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_schools_ibfk_56` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_tr_0900_ai_ci;

-- railway.user_schools: ~1 rows (yaklaşık) tablosu için veriler indiriliyor
INSERT INTO `user_schools` (`id`, `user_id`, `school_id`, `is_primary`, `assigned_at`) VALUES
	(3, 4, 1, 0, '2025-10-07 12:31:49');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
