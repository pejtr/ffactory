CREATE TABLE `generations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`model` enum('nano-banana-2','nano-banana-2-edit','nano-banana-pro','nano-banana-pro-edit','seedream-5-edit','kling-motion-control','kling-video-edit','kling-i2v','hailuo-t2v','hailuo-i2v','wan22-t2v','wan22-i2v') NOT NULL,
	`type` enum('t2i','i2i','t2v','i2v','v2v') NOT NULL,
	`prompt` text NOT NULL,
	`inputImageUrls` json,
	`inputVideoUrl` text,
	`resultUrl` text,
	`resultUrls` json,
	`falRequestId` varchar(128),
	`klingTaskId` varchar(128),
	`creditsCost` int NOT NULL DEFAULT 0,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `generations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `credit_transactions` MODIFY COLUMN `type` enum('signup_bonus','video_generation','scene_generation','soul_id_generation','admin_grant','daily_bonus','generate_hub') NOT NULL;