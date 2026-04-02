CREATE TABLE `credit_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`type` enum('signup_bonus','video_generation','scene_generation','soul_id_generation','admin_grant','daily_bonus') NOT NULL,
	`description` varchar(255),
	`projectId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balance` int NOT NULL DEFAULT 100,
	`totalEarned` int NOT NULL DEFAULT 100,
	`totalSpent` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `credits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `characters` ADD `motionPreset` varchar(64) DEFAULT 'static';--> statement-breakpoint
ALTER TABLE `characters` ADD `tags` json;--> statement-breakpoint
ALTER TABLE `characters` ADD `usageCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `characters` ADD `lastUsedProjectId` int;