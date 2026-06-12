CREATE TABLE `rendered_videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`user_id` int NOT NULL,
	`output_url` varchar(512),
	`file_size` int,
	`duration` int,
	`resolution` varchar(32),
	`fps` int NOT NULL DEFAULT 30,
	`codec` varchar(32),
	`bitrate` int,
	`status` enum('queued','rendering','completed','failed') NOT NULL DEFAULT 'queued',
	`progress` int NOT NULL DEFAULT 0,
	`error_message` text,
	`started_at` timestamp,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rendered_videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rendering_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`video_id` int NOT NULL,
	`priority` int NOT NULL DEFAULT 5,
	`mode` enum('realtime','batch') NOT NULL DEFAULT 'realtime',
	`estimated_duration` int,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`worker_id` varchar(128),
	`queued_at` timestamp NOT NULL DEFAULT (now()),
	`started_at` timestamp,
	`completed_at` timestamp,
	CONSTRAINT `rendering_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeline_clips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`position` int NOT NULL,
	`type` enum('video','image','text','audio','transition') NOT NULL,
	`source_url` varchar(512),
	`start_time` float NOT NULL DEFAULT 0,
	`duration` float NOT NULL,
	`trim_start` float NOT NULL DEFAULT 0,
	`trim_end` float NOT NULL,
	`effects` json,
	`transition_type` varchar(64),
	`transition_duration` float NOT NULL DEFAULT 0.5,
	`text` text,
	`text_style` json,
	`audio_volume` float NOT NULL DEFAULT 1,
	`audio_fade_in` float NOT NULL DEFAULT 0,
	`audio_fade_out` float NOT NULL DEFAULT 0,
	`watermark_url` varchar(512),
	`watermark_opacity` float NOT NULL DEFAULT 0.5,
	`watermark_position` varchar(32),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timeline_clips_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeline_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`aspect_ratio` enum('16:9','9:16','1:1','4:3') NOT NULL DEFAULT '16:9',
	`fps` int NOT NULL DEFAULT 30,
	`resolution` enum('720p','1080p','2K','4K') NOT NULL DEFAULT '1080p',
	`status` enum('draft','rendering','completed','failed') NOT NULL DEFAULT 'draft',
	`clips_count` int NOT NULL DEFAULT 0,
	`total_duration` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timeline_projects_id` PRIMARY KEY(`id`)
);
