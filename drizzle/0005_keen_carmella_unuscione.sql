CREATE TABLE `personas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` varchar(100),
	`gender` varchar(50),
	`age` varchar(50),
	`appearance` text,
	`personality` text,
	`voice_style` varchar(100),
	`catchphrase` varchar(500),
	`backstory` text,
	`avatar_url` varchar(1000),
	`character_id` int,
	`tags` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `personas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `script_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`genre` varchar(100) NOT NULL DEFAULT 'horror',
	`format` varchar(50) NOT NULL DEFAULT 'shorts',
	`description` text,
	`scenes` json,
	`persona_slots` json,
	`variables` json,
	`is_public` tinyint NOT NULL DEFAULT 0,
	`usage_count` int NOT NULL DEFAULT 0,
	`viral_score` float,
	`tags` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `script_templates_id` PRIMARY KEY(`id`)
);
