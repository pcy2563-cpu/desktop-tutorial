CREATE TABLE IF NOT EXISTS `user_behavior_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `behavior_type` varchar(50) NOT NULL,
  `target_type` varchar(30) DEFAULT NULL,
  `target_id` int(11) DEFAULT NULL,
  `category` varchar(30) DEFAULT NULL,
  `keyword` varchar(100) DEFAULT NULL,
  `stay_duration` int(11) NOT NULL DEFAULT '0',
  `extra_data` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_behavior_user_time` (`user_id`, `created_at`),
  KEY `idx_behavior_type_time` (`behavior_type`, `created_at`),
  KEY `idx_behavior_target` (`target_type`, `target_id`),
  KEY `idx_behavior_category_time` (`category`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
