CREATE TABLE `agent_decisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_name` varchar(64) NOT NULL,
	`run_id` varchar(128) NOT NULL,
	`decision_type` enum('pause','scale','create','update','alert','approve','reject','recommend') NOT NULL,
	`source` enum('rules','ai','hybrid') NOT NULL,
	`title` varchar(256) NOT NULL,
	`reasoning` text NOT NULL,
	`impact` varchar(256),
	`confidence` int NOT NULL DEFAULT 50,
	`status` enum('applied','pending','approved','rejected','superseded') NOT NULL DEFAULT 'pending',
	`metadata` json,
	`approved_by` varchar(128),
	`rejected_reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`applied_at` timestamp,
	CONSTRAINT `agent_decisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_name` varchar(64) NOT NULL,
	`run_id` varchar(128) NOT NULL,
	`status` enum('success','error','skipped') NOT NULL,
	`duration_ms` int,
	`decisions_count` int NOT NULL DEFAULT 0,
	`applied_count` int NOT NULL DEFAULT 0,
	`score` int NOT NULL DEFAULT 50,
	`summary` text,
	`metrics_snapshot` json,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_thresholds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_name` varchar(64) NOT NULL,
	`rule_id` varchar(32) NOT NULL,
	`value` float NOT NULL,
	`updated_by` varchar(128) NOT NULL DEFAULT 'system',
	`reason` text,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_thresholds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leados_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`webhook_url` varchar(512),
	`api_key` varchar(256),
	`enabled` boolean NOT NULL DEFAULT false,
	`last_push_at` timestamp,
	`last_push_status` enum('success','failed'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leados_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `leados_config_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `orchestrator_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`run_id` varchar(128) NOT NULL,
	`triggered_by` enum('cron','manual','leadOS','event') NOT NULL,
	`overall_score` int NOT NULL DEFAULT 50,
	`total_decisions` int NOT NULL DEFAULT 0,
	`applied_decisions` int NOT NULL DEFAULT 0,
	`pending_decisions` int NOT NULL DEFAULT 0,
	`summary` text,
	`agent_results` json,
	`alerts` json,
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`finished_at` timestamp,
	CONSTRAINT `orchestrator_runs_id` PRIMARY KEY(`id`),
	CONSTRAINT `orchestrator_runs_run_id_unique` UNIQUE(`run_id`)
);
