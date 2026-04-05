CREATE TABLE `hook_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`notebookId` int,
	`sourceId` int,
	`category` enum('question','shock','story','statistic','controversy','promise','curiosity','challenge') NOT NULL,
	`template` text NOT NULL,
	`example` text,
	`viralScore` float,
	`usageCount` int NOT NULL DEFAULT 0,
	`isFavorite` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hook_templates_id` PRIMARY KEY(`id`)
);
