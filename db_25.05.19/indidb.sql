-- --------------------------------------------------------
-- 호스트:                          127.0.0.1
-- 서버 버전:                        8.0.41 - MySQL Community Server - GPL
-- 서버 OS:                        Win64
-- HeidiSQL 버전:                  12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- indidb 데이터베이스 구조 내보내기
CREATE DATABASE IF NOT EXISTS `indidb` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `indidb`;

-- 테이블 indidb.chat_member 구조 내보내기
CREATE TABLE IF NOT EXISTS `chat_member` (
  `chat_no` int NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `last_read` datetime DEFAULT NULL,
  `joined_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`chat_no`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 indidb.chat_message 구조 내보내기
CREATE TABLE IF NOT EXISTS `chat_message` (
  `message_no` int NOT NULL AUTO_INCREMENT,
  `chat_no` int NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `content` text NOT NULL,
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`message_no`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 indidb.chat_room 구조 내보내기
CREATE TABLE IF NOT EXISTS `chat_room` (
  `chat_no` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `profile_img` varchar(200) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`chat_no`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 indidb.comment 구조 내보내기
CREATE TABLE IF NOT EXISTS `comment` (
  `comment_no` int NOT NULL AUTO_INCREMENT,
  `feed_no` int DEFAULT NULL,
  `maker_no` varchar(50) DEFAULT NULL,
  `comment_contents` varchar(500) DEFAULT NULL,
  `comment_cdate` datetime DEFAULT NULL,
  `comment_udate` datetime DEFAULT NULL,
  `parent_comment_no` int DEFAULT NULL,
  PRIMARY KEY (`comment_no`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 indidb.comment_like 구조 내보내기
CREATE TABLE IF NOT EXISTS `comment_like` (
  `comment_no` int NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `liked_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`comment_no`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 indidb.feed 구조 내보내기
CREATE TABLE IF NOT EXISTS `feed` (
  `feed_no` int NOT NULL AUTO_INCREMENT,
  `group_no` int DEFAULT NULL,
  `maker_id` varchar(500) DEFAULT NULL,
  `feed_title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `feed_contents` varchar(3000) DEFAULT NULL,
  `feed_filepath` varchar(255) DEFAULT NULL,
  `feed_status` varchar(10) DEFAULT NULL,
  `feed_cdate` datetime DEFAULT NULL,
  `feed_udate` datetime DEFAULT NULL,
  PRIMARY KEY (`feed_no`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 indidb.feed_image 구조 내보내기
CREATE TABLE IF NOT EXISTS `feed_image` (
  `image_id` int NOT NULL AUTO_INCREMENT,
  `feed_no` int DEFAULT NULL,
  `image_path` varchar(500) DEFAULT NULL,
  `image_order` int DEFAULT '0',
  PRIMARY KEY (`image_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 indidb.feed_like 구조 내보내기
CREATE TABLE IF NOT EXISTS `feed_like` (
  `like_no` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) DEFAULT NULL,
  `feed_no` int DEFAULT NULL,
  `like_date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`like_no`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 indidb.group_manage 구조 내보내기
CREATE TABLE IF NOT EXISTS `group_manage` (
  `user_id` varchar(50) NOT NULL,
  `group_no` int NOT NULL,
  `group_auth` char(1) DEFAULT NULL,
  PRIMARY KEY (`user_id`,`group_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 indidb.group_tag 구조 내보내기
CREATE TABLE IF NOT EXISTS `group_tag` (
  `group_no` int DEFAULT NULL,
  `tag_no` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 indidb.notification 구조 내보내기
CREATE TABLE IF NOT EXISTS `notification` (
  `noti_no` int NOT NULL AUTO_INCREMENT,
  `noti_type` char(1) DEFAULT NULL,
  `noti_title` varchar(255) DEFAULT NULL,
  `noti_receiver` varchar(50) DEFAULT NULL,
  `noti_isread` char(1) DEFAULT NULL,
  `chat_no` int DEFAULT NULL,
  `group_no` int DEFAULT NULL,
  `user_id` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`noti_no`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 indidb.plan 구조 내보내기
CREATE TABLE IF NOT EXISTS `plan` (
  `plan_no` int NOT NULL AUTO_INCREMENT,
  `group_no` int DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `plan_cdate` datetime DEFAULT NULL,
  `plan_title` varchar(50) DEFAULT NULL,
  `plan_contents` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`plan_no`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 indidb.tbl_group 구조 내보내기
CREATE TABLE IF NOT EXISTS `tbl_group` (
  `group_no` int NOT NULL AUTO_INCREMENT,
  `maker_id` varchar(50) DEFAULT NULL,
  `group_name` varchar(100) DEFAULT NULL,
  `group_comment` varchar(255) DEFAULT NULL,
  `group_status` varchar(10) DEFAULT NULL,
  `group_imgpath` varchar(255) DEFAULT NULL,
  `group_cdate` datetime DEFAULT NULL,
  PRIMARY KEY (`group_no`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 indidb.tbl_tag 구조 내보내기
CREATE TABLE IF NOT EXISTS `tbl_tag` (
  `tag_no` int NOT NULL AUTO_INCREMENT,
  `tag_name` varchar(100) NOT NULL,
  PRIMARY KEY (`tag_no`),
  UNIQUE KEY `tag_name` (`tag_name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 indidb.user 구조 내보내기
CREATE TABLE IF NOT EXISTS `user` (
  `user_id` varchar(50) NOT NULL,
  `user_pwd` varchar(500) DEFAULT NULL,
  `user_name` varchar(100) DEFAULT NULL,
  `user_info` varchar(255) DEFAULT NULL,
  `user_imgpath` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'uploads/default_profile.png',
  `user_status` char(1) DEFAULT NULL,
  `user_cdate` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
