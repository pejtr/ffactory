-- Motion Transfer Tables (Phase 17: SCAIL-2 GGUF)
-- Handles character animation from driving videos using Wan 2.1 motion transfer

CREATE TABLE IF NOT EXISTS `motion_transfer_projects` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` int NOT NULL,
  `video_project_id` int,
  `title` varchar(255) NOT NULL,
  `description` text,
  
  -- Input media
  `reference_image_url` text NOT NULL COMMENT 'Character/avatar image',
  `driving_video_url` text NOT NULL COMMENT 'Motion source video',
  
  -- Output
  `output_video_url` text,
  `preview_url` text COMMENT 'First 5 seconds preview',
  
  -- Processing
  `status` enum('draft', 'uploading', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'draft' NOT NULL,
  `progress` int DEFAULT 0 NOT NULL COMMENT '0-100 percentage',
  `current_phase` varchar(64) COMMENT 'masking, transfer, stitching, etc',
  
  -- Configuration
  `video_duration` int COMMENT 'Seconds (calculated from driving video)',
  `chunk_size` int DEFAULT 81 NOT NULL COMMENT 'Frames per chunk',
  `color_matching_threshold` float DEFAULT 0.95 NOT NULL,
  `gpu_config` json COMMENT '{"multiGpu": boolean, "offloadGpu": number}',
  
  -- Performance
  `estimated_cost_usd` float,
  `actual_cost_usd` float,
  `processing_time_seconds` int,
  
  -- Error handling
  `error_message` text,
  `error_code` varchar(64),
  
  -- Metadata
  `metadata` json COMMENT 'model_version, quality_score, seamless_score, etc',
  
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  KEY `user_id` (`user_id`),
  KEY `video_project_id` (`video_project_id`),
  KEY `status` (`status`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `motion_transfer_settings` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` int,
  
  -- GPU configuration
  `enable_multi_gpu` boolean DEFAULT false,
  `primary_gpu_id` varchar(64),
  `secondary_gpu_id` varchar(64),
  `max_vram_gb` int DEFAULT 8,
  
  -- Processing preferences
  `default_chunk_size` int DEFAULT 81,
  `default_color_matching_threshold` float DEFAULT 0.95,
  
  -- Quality settings
  `output_resolution` varchar(32) DEFAULT '1920x1080',
  `output_fps` int DEFAULT 30,
  `output_codec` varchar(32) DEFAULT 'h264',
  
  -- Masking (SAM3.1)
  `enable_auto_masking` boolean DEFAULT true,
  `masking_quality` varchar(32) DEFAULT 'high' COMMENT 'low, medium, high',
  
  -- Model version
  `wan21_model_version` varchar(64) DEFAULT 'v1.0',
  `sam31_model_version` varchar(64) DEFAULT 'v1.0',
  
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `motion_transfer_queue` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `project_id` int NOT NULL,
  `user_id` int NOT NULL,
  `priority` int DEFAULT 5 NOT NULL COMMENT '1-10, higher = more urgent',
  `status` enum('pending', 'processing', 'completed', 'failed') DEFAULT 'pending' NOT NULL,
  `worker_id` varchar(128),
  `queued_at` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `started_at` timestamp,
  `completed_at` timestamp,
  
  KEY `project_id` (`project_id`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`),
  KEY `priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
