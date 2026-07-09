import { mysqlTable, mysqlSchema, AnyMySqlColumn, int, varchar, mysqlEnum, text, json, timestamp, float, index, tinyint } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const agentDecisions = mysqlTable("agent_decisions", {
	id: int().autoincrement().notNull(),
	agentName: varchar("agent_name", { length: 64 }).notNull(),
	runId: varchar("run_id", { length: 128 }).notNull(),
	decisionType: mysqlEnum("decision_type", ['pause','scale','create','update','alert','approve','reject','recommend']).notNull(),
	source: mysqlEnum(['rules','ai','hybrid']).notNull(),
	title: varchar({ length: 256 }).notNull(),
	reasoning: text().notNull(),
	impact: varchar({ length: 256 }),
	confidence: int().default(50).notNull(),
	status: mysqlEnum(['applied','pending','approved','rejected','superseded']).default('pending').notNull(),
	metadata: json(),
	approvedBy: varchar("approved_by", { length: 128 }),
	rejectedReason: text("rejected_reason"),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	appliedAt: timestamp("applied_at", { mode: 'string' }),
});

export const agentRuns = mysqlTable("agent_runs", {
	id: int().autoincrement().notNull(),
	agentName: varchar("agent_name", { length: 64 }).notNull(),
	runId: varchar("run_id", { length: 128 }).notNull(),
	status: mysqlEnum(['success','error','skipped']).notNull(),
	durationMs: int("duration_ms"),
	decisionsCount: int("decisions_count").default(0).notNull(),
	appliedCount: int("applied_count").default(0).notNull(),
	score: int().default(50).notNull(),
	summary: text(),
	metricsSnapshot: json("metrics_snapshot"),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const agentThresholds = mysqlTable("agent_thresholds", {
	id: int().autoincrement().notNull(),
	agentName: varchar("agent_name", { length: 64 }).notNull(),
	ruleId: varchar("rule_id", { length: 32 }).notNull(),
	value: float().notNull(),
	updatedBy: varchar("updated_by", { length: 128 }).default('system').notNull(),
	reason: text(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const audioTracks = mysqlTable("audio_tracks", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull(),
	trackType: mysqlEnum(['bgm','voiceover','sfx','dialogue']).notNull(),
	title: varchar({ length: 255 }),
	prompt: text(),
	audioUrl: text(),
	duration: float(),
	characterId: int(),
	status: mysqlEnum(['pending','generating','completed','failed']).default('pending').notNull(),
	taskId: varchar({ length: 128 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const channelBlueprints = mysqlTable("channel_blueprints", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull(),
	channelId: int("channel_id"),
	niche: varchar({ length: 256 }).notNull(),
	nicheScore: int("niche_score"),
	channelName: varchar("channel_name", { length: 256 }),
	brandIdentity: json("brand_identity"),
	videoPlan: json("video_plan"),
	roadmap: json(),
	postingCadence: mysqlEnum("posting_cadence", ['daily','5x_week','3x_week','2x_week','weekly']).default('3x_week').notNull(),
	targetLanguage: varchar("target_language", { length: 16 }).default('cs').notNull(),
	status: mysqlEnum(['generating','ready','active','archived']).default('generating').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const channelPosts = mysqlTable("channel_posts", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull(),
	projectId: int("project_id").notNull(),
	channelId: int("channel_id").notNull(),
	youtubeVideoId: varchar("youtube_video_id", { length: 64 }),
	title: varchar({ length: 256 }).notNull(),
	description: text(),
	tags: text(),
	language: varchar({ length: 16 }).default('cs').notNull(),
	thumbnailUrl: varchar("thumbnail_url", { length: 1000 }),
	status: mysqlEnum(['draft','scheduled','uploading','published','failed']).default('draft').notNull(),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	errorMessage: text("error_message"),
	viewCount: int("view_count").default(0).notNull(),
	likeCount: int("like_count").default(0).notNull(),
	commentCount: int("comment_count").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const characters = mysqlTable("characters", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	projectId: int(),
	name: varchar({ length: 128 }).notNull(),
	description: text(),
	personality: text(),
	referenceImageUrl: text(),
	soulIdImageUrl: text(),
	voiceId: varchar({ length: 128 }),
	voiceName: varchar({ length: 128 }),
	defaultEmotion: varchar({ length: 64 }).default('neutral'),
	metadata: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	referenceImages: json(),
	motionPreset: varchar({ length: 64 }).default('static'),
	tags: json(),
	usageCount: int().default(0).notNull(),
	lastUsedProjectId: int(),
});

export const creditTransactions = mysqlTable("credit_transactions", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	amount: int().notNull(),
	type: mysqlEnum(['signup_bonus','purchase','video_generation','image_generation','audio_generation','motion_generation','video_edit','image_edit','generate_hub','story_script','story_video','story_thumbnail','refund','referral_bonus','referral_signup']).notNull(),
	description: varchar({ length: 255 }),
	projectId: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const credits = mysqlTable("credits", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	balance: int().default(100).notNull(),
	totalEarned: int().default(100).notNull(),
	totalSpent: int().default(0).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const generations = mysqlTable("generations", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	model: mysqlEnum(['nano-banana-2','nano-banana-2-edit','nano-banana-pro','nano-banana-pro-edit','seedream-5-edit','kling-motion-control','kling-video-edit','kling-i2v','hailuo-t2v','hailuo-i2v','wan22-t2v','wan22-i2v']).notNull(),
	type: mysqlEnum(['t2i','i2i','t2v','i2v','v2v']).notNull(),
	prompt: text().notNull(),
	inputImageUrls: json(),
	inputVideoUrl: text(),
	resultUrl: text(),
	resultUrls: json(),
	falRequestId: varchar({ length: 128 }),
	klingTaskId: varchar({ length: 128 }),
	creditsCost: int().default(0).notNull(),
	status: mysqlEnum(['pending','processing','completed','failed']).default('pending').notNull(),
	errorMessage: text(),
	metadata: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const hookTemplates = mysqlTable("hook_templates", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	notebookId: int(),
	sourceId: int(),
	category: mysqlEnum(['question','shock','story','statistic','controversy','promise','curiosity','challenge']).notNull(),
	template: text().notNull(),
	example: text(),
	viralScore: float(),
	usageCount: int().default(0).notNull(),
	isFavorite: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const leadosConfig = mysqlTable("leados_config", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull(),
	webhookUrl: varchar("webhook_url", { length: 512 }),
	apiKey: varchar("api_key", { length: 256 }),
	enabled: tinyint().default(0).notNull(),
	lastPushAt: timestamp("last_push_at", { mode: 'string' }),
	lastPushStatus: mysqlEnum("last_push_status", ['success','failed']),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("leados_config_user_id_unique").on(table.userId),
]);

export const orchestratorRuns = mysqlTable("orchestrator_runs", {
	id: int().autoincrement().notNull(),
	runId: varchar("run_id", { length: 128 }).notNull(),
	triggeredBy: mysqlEnum("triggered_by", ['cron','manual','leadOS','event']).notNull(),
	overallScore: int("overall_score").default(50).notNull(),
	totalDecisions: int("total_decisions").default(0).notNull(),
	appliedDecisions: int("applied_decisions").default(0).notNull(),
	pendingDecisions: int("pending_decisions").default(0).notNull(),
	summary: text(),
	agentResults: json("agent_results"),
	alerts: json(),
	startedAt: timestamp("started_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	finishedAt: timestamp("finished_at", { mode: 'string' }),
},
(table) => [
	index("orchestrator_runs_run_id_unique").on(table.runId),
]);

export const personas = mysqlTable("personas", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 100 }),
	gender: varchar({ length: 50 }),
	age: varchar({ length: 50 }),
	appearance: text(),
	personality: text(),
	voiceStyle: varchar("voice_style", { length: 100 }),
	catchphrase: varchar({ length: 500 }),
	backstory: text(),
	avatarUrl: varchar("avatar_url", { length: 1000 }),
	characterId: int("character_id"),
	tags: varchar({ length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const referrals = mysqlTable("referrals", {
	id: int().autoincrement().notNull(),
	referrerId: int().notNull(),
	referredId: int().notNull(),
	code: varchar({ length: 16 }).notNull(),
	status: mysqlEnum(['pending','completed']).default('completed').notNull(),
	creditsAwarded: int().default(50).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const renderedVideos = mysqlTable("rendered_videos", {
	id: int().autoincrement().notNull(),
	projectId: int("project_id").notNull(),
	userId: int("user_id").notNull(),
	outputUrl: varchar("output_url", { length: 512 }),
	fileSize: int("file_size"),
	duration: int(),
	resolution: varchar({ length: 32 }),
	fps: int().default(30).notNull(),
	codec: varchar({ length: 32 }),
	bitrate: int(),
	status: mysqlEnum(['queued','rendering','completed','failed']).default('queued').notNull(),
	progress: int().default(0).notNull(),
	errorMessage: text("error_message"),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const renderingQueue = mysqlTable("rendering_queue", {
	id: int().autoincrement().notNull(),
	videoId: int("video_id").notNull(),
	priority: int().default(5).notNull(),
	mode: mysqlEnum(['realtime','batch']).default('realtime').notNull(),
	estimatedDuration: int("estimated_duration"),
	status: mysqlEnum(['pending','processing','completed','failed']).default('pending').notNull(),
	workerId: varchar("worker_id", { length: 128 }),
	queuedAt: timestamp("queued_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	bgmUrl: varchar("bgm_url", { length: 512 }),
	bgmVolume: float("bgm_volume").default(0.3),
});

export const scenes = mysqlTable("scenes", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull(),
	sceneIndex: int().notNull(),
	title: varchar({ length: 255 }),
	description: text().notNull(),
	dialogue: text(),
	visualPrompt: text(),
	emotion: varchar({ length: 64 }).default('neutral'),
	sceneType: mysqlEnum(['dialogue','broll','action','lipsync','dream','transition']).default('broll').notNull(),
	videoModel: varchar({ length: 64 }),
	characterIds: json(),
	duration: int().default(5),
	status: mysqlEnum(['pending','generating','completed','failed','cancelled']).default('pending').notNull(),
	videoUrl: text(),
	audioUrl: text(),
	thumbnailUrl: text(),
	klingTaskId: varchar({ length: 128 }),
	falTaskId: varchar({ length: 128 }),
	errorMessage: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const scriptTemplates = mysqlTable("script_templates", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	genre: varchar({ length: 100 }).default('horror').notNull(),
	format: varchar({ length: 50 }).default('shorts').notNull(),
	description: text(),
	scenes: json(),
	personaSlots: json("persona_slots"),
	variables: json(),
	isPublic: tinyint("is_public").default(0).notNull(),
	usageCount: int("usage_count").default(0).notNull(),
	viralScore: float("viral_score"),
	tags: varchar({ length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const storyNotebooks = mysqlTable("story_notebooks", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	niche: varchar({ length: 128 }),
	targetAudience: text(),
	contentStyle: mysqlEnum(['educational','storytelling','explainer','documentary','entertainment','news','tutorial']).default('educational').notNull(),
	language: varchar({ length: 16 }).default('cs').notNull(),
	aiAnalysis: json(),
	hookTemplates: json(),
	videoIdeas: json(),
	status: mysqlEnum(['active','archived']).default('active').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const storyScripts = mysqlTable("story_scripts", {
	id: int().autoincrement().notNull(),
	notebookId: int().notNull(),
	userId: int().notNull(),
	title: varchar({ length: 512 }).notNull(),
	hook: text(),
	script: text().notNull(),
	scriptType: mysqlEnum(['youtube_short','youtube_long','explainer','whiteboard','documentary','story','educational']).default('educational').notNull(),
	targetDurationSec: int().default(180),
	language: varchar({ length: 16 }).default('cs').notNull(),
	seoTitles: json(),
	seoDescription: text(),
	seoTags: json(),
	voiceoverUrl: text(),
	videoUrl: text(),
	videoStyle: mysqlEnum(['whiteboard','kinetic','anime','watercolor','hand_drawn','classic','illusion']),
	videoStatus: mysqlEnum(['none','generating','completed','failed']).default('none').notNull(),
	videoTaskId: varchar({ length: 256 }),
	creditsUsed: int().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const storySources = mysqlTable("story_sources", {
	id: int().autoincrement().notNull(),
	notebookId: int().notNull(),
	userId: int().notNull(),
	type: mysqlEnum(['youtube_url','text','url','file']).notNull(),
	title: varchar({ length: 512 }),
	content: text(),
	url: text(),
	summary: text(),
	keyInsights: json(),
	hookPatterns: json(),
	viralScore: float(),
	metadata: json(),
	status: mysqlEnum(['pending','processing','ready','failed']).default('pending').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const storyThumbnails = mysqlTable("story_thumbnails", {
	id: int().autoincrement().notNull(),
	scriptId: int().notNull(),
	userId: int().notNull(),
	prompt: text(),
	style: varchar({ length: 64 }),
	imageUrl: text(),
	isSelected: tinyint().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const timelineClips = mysqlTable("timeline_clips", {
	id: int().autoincrement().notNull(),
	projectId: int("project_id").notNull(),
	position: int().notNull(),
	type: mysqlEnum(['video','image','text','audio','transition']).notNull(),
	sourceUrl: varchar("source_url", { length: 512 }),
	startTime: float("start_time").notNull(),
	duration: float().notNull(),
	trimStart: float("trim_start").notNull(),
	trimEnd: float("trim_end").notNull(),
	effects: json(),
	transitionType: varchar("transition_type", { length: 64 }),
	transitionDuration: float("transition_duration").default(0.5).notNull(),
	text: text(),
	textStyle: json("text_style"),
	audioVolume: float("audio_volume").default(1).notNull(),
	audioFadeIn: float("audio_fade_in").notNull(),
	audioFadeOut: float("audio_fade_out").notNull(),
	watermarkUrl: varchar("watermark_url", { length: 512 }),
	watermarkOpacity: float("watermark_opacity").default(0.5).notNull(),
	watermarkPosition: varchar("watermark_position", { length: 32 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const timelineProjects = mysqlTable("timeline_projects", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	aspectRatio: mysqlEnum("aspect_ratio", ['16:9','9:16','1:1','4:3']).default('16:9').notNull(),
	fps: int().default(30).notNull(),
	resolution: mysqlEnum(['720p','1080p','2K','4K']).default('1080p').notNull(),
	status: mysqlEnum(['draft','rendering','completed','failed']).default('draft').notNull(),
	clipsCount: int("clips_count").default(0).notNull(),
	totalDuration: int("total_duration").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const userAchievements = mysqlTable("user_achievements", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	achievementKey: varchar({ length: 128 }).notNull(),
	unlockedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	creditReward: int().default(0).notNull(),
	notified: tinyint().default(0).notNull(),
});

export const userStreaks = mysqlTable("user_streaks", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	currentStreak: int().default(0).notNull(),
	longestStreak: int().default(0).notNull(),
	lastClaimedAt: timestamp({ mode: 'string' }),
	streakFreezeUsed: tinyint().default(0).notNull(),
	totalDaysClaimed: int().default(0).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("user_streaks_userId_unique").on(table.userId),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user','admin']).default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	referralCode: varchar({ length: 16 }),
},
(table) => [
	index("users_openId_unique").on(table.openId),
	index("users_referralCode_unique").on(table.referralCode),
]);

export const videoProjects = mysqlTable("video_projects", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	title: varchar({ length: 255 }).notNull(),
	idea: text().notNull(),
	genre: varchar({ length: 64 }),
	emotionalTone: varchar({ length: 64 }),
	dreamMode: tinyint().default(0),
	targetDuration: int().default(60),
	status: mysqlEnum(['draft','generating_screenplay','generating_scenes','generating_audio','assembling','completed','failed','cancelled']).default('draft').notNull(),
	screenplay: json(),
	shareToken: varchar({ length: 64 }),
	finalVideoUrl: text(),
	thumbnailUrl: text(),
	estimatedCostUsd: float(),
	actualCostUsd: float(),
	errorMessage: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	projectType: mysqlEnum(['standard','reference_recreation']).default('standard').notNull(),
	referenceVideoUrl: text(),
	referenceUsageNote: text(),
	aspectRatio: varchar({ length: 8 }).default('16:9'),
	seedancePrompt: json(),
},
(table) => [
	index("video_projects_shareToken_unique").on(table.shareToken),
]);

export const youtubeChannels = mysqlTable("youtube_channels", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull(),
	channelId: varchar("channel_id", { length: 64 }).notNull(),
	channelName: varchar("channel_name", { length: 256 }).notNull(),
	channelHandle: varchar("channel_handle", { length: 128 }),
	thumbnailUrl: varchar("thumbnail_url", { length: 1000 }),
	accessToken: text("access_token").notNull(),
	refreshToken: text("refresh_token").notNull(),
	tokenExpiresAt: int("token_expires_at").notNull(),
	subscriberCount: int("subscriber_count").default(0),
	videoCount: int("video_count").default(0),
	viewCount: int("view_count").default(0),
	isActive: tinyint("is_active").default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});


// ─── Motion Transfer (Phase 17) ────────────────────────────────────────────────

export const motionTransferProjects = mysqlTable("motion_transfer_projects", {
	id: int().autoincrement().primaryKey().notNull(),
	userId: int().notNull(),
	projectId: int(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	drivingVideoUrl: varchar("driving_video_url", { length: 1000 }),
	drivingVideoKey: varchar("driving_video_key", { length: 255 }),
	referenceImageUrl: varchar("reference_image_url", { length: 1000 }),
	referenceImageKey: varchar("reference_image_key", { length: 255 }),
	characterId: int("character_id"),
	characterName: varchar("character_name", { length: 255 }),
	soulId: varchar("soul_id", { length: 128 }),
	status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
	outputVideoUrl: varchar("output_video_url", { length: 1000 }),
	outputVideoKey: varchar("output_video_key", { length: 255 }),
	errorMessage: text("error_message"),
	jobId: varchar("job_id", { length: 128 }),
	provider: mysqlEnum("provider", ["fal", "local", "kling"]).default("fal").notNull(),
	processingTimeMs: int("processing_time_ms"),
	creditsCost: int("credits_cost").default(0).notNull(),
	metadata: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
});

export const motionTransferSettings = mysqlTable("motion_transfer_settings", {
	id: int().autoincrement().primaryKey().notNull(),
	userId: int().notNull(),
	provider: mysqlEnum("provider", ["fal", "local", "kling"]).default("fal").notNull(),
	enableAutoRetry: tinyint("enable_auto_retry").default(1).notNull(),
	maxRetries: int("max_retries").default(3).notNull(),
	timeoutSeconds: int("timeout_seconds").default(1800).notNull(),
	qualityPreset: mysqlEnum("quality_preset", ["low", "medium", "high", "ultra"]).default("high").notNull(),
	customSettings: json("custom_settings"),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const motionTransferQueue = mysqlTable("motion_transfer_queue", {
	id: int().autoincrement().primaryKey().notNull(),
	projectId: int().notNull(),
	userId: int().notNull(),
	status: mysqlEnum("status", ["queued", "processing", "completed", "failed", "cancelled"]).default("queued").notNull(),
	priority: int().default(0).notNull(),
	retryCount: int("retry_count").default(0).notNull(),
	lastError: text("last_error"),
	nextRetryAt: timestamp("next_retry_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export type MotionTransferProject = typeof motionTransferProjects.$inferSelect;
export type InsertMotionTransferProject = typeof motionTransferProjects.$inferInsert;
export type MotionTransferSettings = typeof motionTransferSettings.$inferSelect;
export type MotionTransferQueue = typeof motionTransferQueue.$inferSelect;
