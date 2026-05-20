ALTER TABLE `credit_transactions` MODIFY COLUMN `type` enum('signup_bonus','purchase','video_generation','image_generation','audio_generation','motion_generation','video_edit','image_edit','generate_hub','story_script','story_video','story_thumbnail','refund','referral_bonus','referral_signup') NOT NULL;--> statement-breakpoint
ALTER TABLE `video_projects` ADD `projectType` enum('standard','reference_recreation') DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE `video_projects` ADD `referenceVideoUrl` text;--> statement-breakpoint
ALTER TABLE `video_projects` ADD `referenceUsageNote` text;--> statement-breakpoint
ALTER TABLE `video_projects` ADD `aspectRatio` varchar(8) DEFAULT '16:9';--> statement-breakpoint
ALTER TABLE `video_projects` ADD `seedancePrompt` json;