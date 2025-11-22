-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               10.4.32-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             12.12.0.7122
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for auth_db
CREATE DATABASE IF NOT EXISTS `auth_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `auth_db`;

-- Dumping structure for table auth_db.applications
CREATE TABLE IF NOT EXISTS `applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `owner_id` varchar(100) NOT NULL,
  `app_secret` varchar(255) NOT NULL,
  `version` varchar(20) DEFAULT '1.0',
  `status` varchar(20) DEFAULT 'active',
  `paused` tinyint(1) DEFAULT 0,
  `user_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_app_name_user` (`name`,`user_id`),
  KEY `idx_applications_user_id` (`user_id`),
  KEY `idx_applications_owner_id` (`owner_id`),
  CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table auth_db.chat_messages
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `is_staff` tinyint(1) DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_messages_ticket_id` (`ticket_id`),
  KEY `idx_messages_created_at` (`created_at`),
  CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table auth_db.licenses
CREATE TABLE IF NOT EXISTS `licenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `license_key` varchar(100) NOT NULL,
  `subscription` varchar(20) NOT NULL,
  `expires` datetime NOT NULL,
  `used` tinyint(1) DEFAULT 0,
  `user_id` int(11) DEFAULT NULL,
  `app_id` int(11) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_license_app` (`license_key`,`app_id`),
  KEY `user_id` (`user_id`),
  KEY `app_id` (`app_id`),
  KEY `idx_licenses_key` (`license_key`),
  CONSTRAINT `licenses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `licenses_ibfk_2` FOREIGN KEY (`app_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table auth_db.payments
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `plan` varchar(20) NOT NULL,
  `period` varchar(20) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `preference_id` varchar(255) DEFAULT NULL,
  `payment_id` varchar(255) DEFAULT NULL,
  `external_reference` varchar(255) NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `external_reference` (`external_reference`),
  KEY `idx_payments_user_id` (`user_id`),
  KEY `idx_payments_external_reference` (`external_reference`),
  KEY `idx_payments_status` (`status`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table auth_db.support_tickets
CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'open',
  `priority` varchar(20) DEFAULT 'normal',
  `assigned_to` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_message_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_tickets_user_id` (`user_id`),
  KEY `idx_tickets_status` (`status`),
  KEY `idx_tickets_assigned_to` (`assigned_to`),
  CONSTRAINT `support_tickets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `support_tickets_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table auth_db.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `subscription` varchar(20) DEFAULT 'standard',
  `expires` datetime NOT NULL,
  `session_token` varchar(64) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `last_login` datetime DEFAULT NULL,
  `verified` tinyint(1) DEFAULT 0,
  `two_factor_secret` varchar(255) DEFAULT NULL,
  `two_factor_enabled` tinyint(1) DEFAULT 0,
  `account_logs` tinyint(1) DEFAULT 1,
  `new_location_alerts` tinyint(1) DEFAULT 1,
  `profile_picture_url` varchar(500) DEFAULT NULL,
  `owner_id` varchar(100) DEFAULT NULL,
  `security_words` text DEFAULT NULL,
  `hwid` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `banned` tinyint(1) DEFAULT 0,
  `app_id` int(11) DEFAULT NULL,
  `is_admin` tinyint(1) DEFAULT 0,
  `plan` varchar(20) DEFAULT 'tester',
  `plan_expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `unique_username` (`username`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_session_token` (`session_token`),
  KEY `idx_users_app_id` (`app_id`),
  KEY `idx_users_banned` (`banned`),
  CONSTRAINT `fk_users_app_id` FOREIGN KEY (`app_id`) REFERENCES `applications` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table auth_db.user_variables
CREATE TABLE IF NOT EXISTS `user_variables` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `variable_name` varchar(100) NOT NULL,
  `variable_value` text DEFAULT NULL,
  `app_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_variable_app` (`user_id`,`variable_name`,`app_id`),
  KEY `idx_user_variables_user_id` (`user_id`),
  KEY `idx_user_variables_app_id` (`app_id`),
  CONSTRAINT `user_variables_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_variables_ibfk_2` FOREIGN KEY (`app_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table auth_db.verification_codes
CREATE TABLE IF NOT EXISTS `verification_codes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `code` varchar(255) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `expires` datetime NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `used` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_verification_codes_email` (`email`),
  KEY `idx_verification_codes_expires` (`expires`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
