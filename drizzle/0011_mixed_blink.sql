CREATE TABLE `channel_blueprints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`channel_id` int,
	`niche` varchar(256) NOT NULL,
	`niche_score` int,
	`channel_name` varchar(256),
	`brand_identity` json,
	`video_plan` json,
	`roadmap` json,
	`posting_cadence` enum('daily','5x_week','3x_week','2x_week','weekly') NOT NULL DEFAULT '3x_week',
	`target_language` varchar(16) NOT NULL DEFAULT 'cs',
	`status` enum('generating','ready','active','archived') NOT NULL DEFAULT 'generating',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `channel_blueprints_id` PRIMARY KEY(`id`)
);
