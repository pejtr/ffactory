CREATE TABLE `credit_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`type` enum('signup_bonus','purchase','video_generation','image_generation','audio_generation','motion_generation','video_edit','image_edit','generate_hub','story_script','story_video','story_thumbnail','refund') NOT NULL,
	`description` text,
	`referenceId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`model` varchar(128) NOT NULL,
	`type` enum('text_to_image','image_to_image','text_to_video','image_to_video','video_edit','motion_control') NOT NULL,
	`prompt` text,
	`inputImageUrl` text,
	`inputVideoUrl` text,
	`outputUrl` text,
	`outputUrls` json,
	`status` enum('pending','generating','completed','failed') NOT NULL DEFAULT 'pending',
	`taskId` varchar(256),
	`creditsUsed` int DEFAULT 0,
	`metadata` json,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `generations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `story_notebooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`niche` varchar(128),
	`targetAudience` text,
	`contentStyle` enum('educational','storytelling','explainer','documentary','entertainment','news','tutorial') NOT NULL DEFAULT 'educational',
	`language` varchar(16) NOT NULL DEFAULT 'cs',
	`aiAnalysis` json,
	`hookTemplates` json,
	`videoIdeas` json,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `story_notebooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `story_scripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`notebookId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(512) NOT NULL,
	`hook` text,
	`script` text NOT NULL,
	`scriptType` enum('youtube_short','youtube_long','explainer','whiteboard','documentary','story','educational') NOT NULL DEFAULT 'educational',
	`targetDurationSec` int DEFAULT 180,
	`language` varchar(16) NOT NULL DEFAULT 'cs',
	`seoTitles` json,
	`seoDescription` text,
	`seoTags` json,
	`voiceoverUrl` text,
	`videoUrl` text,
	`videoStyle` enum('whiteboard','kinetic','anime','watercolor','hand_drawn','classic','illusion'),
	`videoStatus` enum('none','generating','completed','failed') NOT NULL DEFAULT 'none',
	`videoTaskId` varchar(256),
	`creditsUsed` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `story_scripts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `story_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`notebookId` int NOT NULL,
	`userId` int NOT NULL,
	`type` enum('youtube_url','text','url','file') NOT NULL,
	`title` varchar(512),
	`content` text,
	`url` text,
	`summary` text,
	`keyInsights` json,
	`hookPatterns` json,
	`viralScore` float,
	`metadata` json,
	`status` enum('pending','processing','ready','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `story_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `story_thumbnails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scriptId` int NOT NULL,
	`userId` int NOT NULL,
	`prompt` text,
	`style` varchar(64),
	`imageUrl` text,
	`isSelected` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `story_thumbnails_id` PRIMARY KEY(`id`)
);
