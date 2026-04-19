CREATE TABLE `user_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementKey` varchar(128) NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	`creditReward` int NOT NULL DEFAULT 0,
	`notified` boolean NOT NULL DEFAULT false,
	CONSTRAINT `user_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_streaks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastClaimedAt` timestamp,
	`streakFreezeUsed` boolean NOT NULL DEFAULT false,
	`totalDaysClaimed` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_streaks_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_streaks_userId_unique` UNIQUE(`userId`)
);
