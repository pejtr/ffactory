# 📋 Video Factory v2.0 — Implementation Roadmap

## 🎯 Current Status

**Version:** 5da8549e (MAGS + PDF Export)  
**TypeScript:** 0 errors ✓  
**Tests:** 58/58 passing ✓  
**Implemented Features:** 35+  
**Database Tables:** 50+  

---

## ✅ COMPLETED PHASES

### Phase 1: YouTube Integration
- [x] YouTube OAuth2 flow
- [x] Channel CRUD (connect, list, disconnect)
- [x] Video posting to YouTube
- [x] Channel analytics + metrics
- [x] SEO generation (titles, descriptions, tags)
- [x] Thumbnail generation (A/B variants)
- [x] Translation support (Czech, English, German)

### Phase 2: Channel Blueprint
- [x] Niche validator (AI scoring 0-100)
- [x] 30-video content plan generator
- [x] 90-day growth roadmap
- [x] Brand identity generator (names, colors, tagline)
- [x] Policy compliance checker
- [x] PDF export (all phases)

### Phase 3: MAGS (Multi-Agent Growth System)
- [x] DB schema (5 MAGS tables)
- [x] RulesEngine + DecisionLog
- [x] VideoAgent (stalled jobs, quality scores)
- [x] ChannelAgent (posting gaps, CTR alerts)
- [x] ContentCalendarAgent (queue management)
- [x] ThumbnailABAgent (A/B winner detection)
- [x] BlueprintAgent (execution tracking)
- [x] AgentOrchestrator (parallel execution)
- [x] Heartbeat cron (every 6 hours)
- [x] LeadOS webhook integration
- [x] MAGS Command Center dashboard

### Phase 4: PuLID Character Lock
- [x] fal.ai PuLID integration
- [x] Character-consistent video generation
- [x] Avatar generator for channel mascot
- [x] ThumbnailAB upgrade (same face across variants)

### Phase 5: PDF Export
- [x] Puppeteer-core PDF generation
- [x] Blueprint PDF export (all phases)
- [x] Roadmap PDF export
- [x] Cover page + styling

---

## 🔄 NEXT PHASES (Priority Order)

### Phase 6: Timeline Editor (Story Liner integration) — FIXED
**Duration:** 8–10 days  
**Modules:** FFmpeg wrapper, React UI, effects, rendering

- [x] FFmpeg wrapper for server-side rendering
- [x] Proper clip concatenation (FFmpeg concat demuxer)
- [x] BGM mixing with audio overlay
- [x] Download endpoint for PC download
- [x] Clip trimming, transitions, effects
- [x] Watermark + branding overlay
- [x] Text overlay + color grading
- [x] Batch rendering queue
- [x] DB migration for BGM fields
- [ ] React drag-and-drop timeline UI (frontend)
- [ ] Real-time preview (frontend)
- [ ] Performance optimization
- [ ] Vitest tests (15+ tests)

**Files created:**
- [x] `server/ffmpegRenderer.ts` — FFmpeg wrapper (FIXED: concat demuxer, BGM mixing)
- [x] `server/routers/timeline.ts` — tRPC procedures (FIXED: download endpoint)
- [ ] `client/src/pages/TimelineEditor.tsx` — React UI (TODO: frontend)
- [x] `drizzle/migrations/0013_timeline_tables.sql` — DB schema
- [x] `drizzle/migrations/0014_melted_trauma.sql` — BGM fields migration

---

### Phase 7: Bernini Video Object Modification (NEW)
**Duration:** 8–10 days  
**Modules:** Bernini API, MAGS ContentModificationAgent, Timeline effects

- [ ] Bernini API integration (FAL.ai or ByteDance)
- [ ] ContentModificationAgent — MAGS agent for autonomous object replacement
  - [ ] Detects low-CTR videos (< 3%)
  - [ ] Analyzes video content with AI (object detection)
  - [ ] Suggests viral object replacements (e.g., basketball → fire ball)
  - [ ] Generates Bernini prompt + executes replacement
  - [ ] A/B tests original vs modified version
  - [ ] Auto-uploads winner to YouTube
- [ ] Timeline Editor — Bernini effects panel
  - [ ] Object selector (click on video to select object)
  - [ ] Replacement prompt input
  - [ ] Live preview (first 5 seconds)
  - [ ] Apply to full video button
  - [ ] Queue for rendering
- [ ] Frontend: Bernini effects UI in TimelineEditor.tsx
- [ ] Tests for ContentModificationAgent (10+ tests)

**Files to create:**
- `server/integrations/bernini.ts` — Bernini API wrapper
- `server/agents/contentModificationAgent.ts` — MAGS agent
- `server/routers/bernini.ts` — tRPC procedures
- `client/src/components/BerniniEffectsPanel.tsx` — React UI
- `drizzle/migrations/0014_bernini_tables.sql` — DB schema

---

### Phase 8: Multi-platform Posting
**Duration:** 12–15 days  
**Modules:** TikTok, Instagram, X, Fanvue, OnlyFans APIs

- [ ] TikTok API integration (OAuth + video upload)
- [ ] Instagram Graph API integration (Reels + Stories)
- [ ] X (Twitter) API integration (video tweets)
- [ ] Fanvue API integration (post scheduling)
- [ ] OnlyFans backup integration
- [ ] Cross-platform scheduler (timezone-aware)
- [ ] Metrics aggregator (views, likes, comments, shares)
- [ ] Post performance analytics
- [ ] Vitest tests (20+ tests)

**Files to create:**
- `server/routers/posting.ts` — tRPC procedures
- `server/integrations/tiktok.ts` — TikTok API wrapper
- `server/integrations/instagram.ts` — Instagram API wrapper
- `server/integrations/x.ts` — X API wrapper
- `server/integrations/fanvue.ts` — Fanvue API wrapper
- `client/src/pages/MultiPlatformPosting.tsx` — React UI
- `drizzle/migrations/0014_multi_platform_tables.sql` — DB schema

---

### Phase 9: AI Chatbot (24/7 Monetization)
**Duration:** 10–12 days  
**Modules:** Fanvue webhook, LLM responses, PPV automation

- [ ] Fanvue message webhook receiver
- [ ] 6 personality modes (nurturing, dominant, mysterious, vulnerable, playful, sensual)
- [ ] Auto-response engine (50+ templates)
- [ ] PPV menu automation (smart upselling)
- [ ] Voice note generation (Kling AI)
- [ ] Tip reaction automation
- [ ] Retention sequences (3-7-14 day follow-ups)
- [ ] OnlyFans DM automation
- [ ] Vitest tests (18+ tests)

**Files to create:**
- `server/routers/chatbot.ts` — tRPC procedures
- `server/agents/chatbotAgent.ts` — Chatbot logic
- `server/_core/webhooks.ts` — Fanvue webhook handler
- `client/src/pages/ChatbotConfig.tsx` — React UI
- `drizzle/migrations/0015_chatbot_tables.sql` — DB schema

---

### Phase 10: Trending Audio Detector
**Duration:** 6–8 days  
**Modules:** TikTok, Spotify, Instagram APIs

- [ ] TikTok trending sounds API polling
- [ ] Spotify viral tracks API polling
- [ ] Instagram trending audio API polling
- [ ] Hourly detection cron job
- [ ] Audio caching + deduplication
- [ ] Suggestion engine for projects
- [ ] Audio matching in timeline
- [ ] Vitest tests (10+ tests)

**Files to create:**
- `server/routers/audio.ts` — tRPC procedures
- `server/agents/trendingAudioAgent.ts` — Detection logic
- `server/integrations/spotify.ts` — Spotify API wrapper
- `client/src/pages/TrendingAudioHub.tsx` — React UI
- `drizzle/migrations/0016_audio_tables.sql` — DB schema

---

### Phase 11: Re-Creation Engine
**Duration:** 8–10 days  
**Modules:** yt-dlp, GPT-4 Vision, LLM transformation

- [ ] yt-dlp video downloader (no watermark)
- [ ] GPT-4 Vision hook analysis
- [ ] Hook transformation (brand voice)
- [ ] CTA transformation
- [ ] Audio matching
- [ ] Caption generation
- [ ] One-click recreation
- [ ] Vitest tests (12+ tests)

**Files to create:**
- `server/routers/recreation.ts` — tRPC procedures
- `server/agents/recreationAgent.ts` — Recreation logic
- `server/integrations/ytdlp.ts` — yt-dlp wrapper
- `client/src/pages/ReCreationStudio.tsx` — React UI
- `drizzle/migrations/0017_recreation_tables.sql` — DB schema

---

### Phase 12: Monetization Dashboard
**Duration:** 6–8 days  
**Modules:** Revenue aggregation, PPV menu, forecasting

- [ ] Revenue metrics aggregator (all platforms)
- [ ] PPV menu builder
- [ ] Fanvue subscriber tracking
- [ ] OnlyFans subscriber tracking
- [ ] YouTube revenue tracking
- [ ] Top-performing content analysis
- [ ] Revenue forecasting (ML-based)
- [ ] Vitest tests (10+ tests)

**Files to create:**
- `server/routers/monetize.ts` — tRPC procedures
- `client/src/pages/MonetizationDashboard.tsx` — React UI
- `drizzle/migrations/0018_monetization_tables.sql` — DB schema

---

### Phase 13: Launch Sequencer
**Duration:** 10–12 days  
**Modules:** 14-day/30-day templates, daily executor

- [ ] 14-day launch template
- [ ] 30-day launch template
- [ ] Custom launch builder
- [ ] Daily executor (content generation + posting)
- [ ] Metrics tracking per day
- [ ] Adaptive recommendations
- [ ] Manual override options
- [ ] Vitest tests (15+ tests)

**Files to create:**
- `server/routers/launch.ts` — tRPC procedures
- `server/agents/launchSequencerAgent.ts` — Executor logic
- `client/src/pages/LaunchSequencer.tsx` — React UI
- `drizzle/migrations/0019_launch_tables.sql` — DB schema

---

### Phase 14: Lightning AI Batch Mode
**Duration:** 6–8 days  
**Modules:** Lightning AI SDK, batch queue, cost optimization

- [ ] Lightning AI SDK integration
- [ ] Batch queue management
- [ ] Spot instance cost optimization
- [ ] Studio lifecycle management
- [ ] Fallback to fal.ai on failure
- [ ] Cost comparison UI
- [ ] Batch scheduling
- [ ] Vitest tests (10+ tests)

**Files to create:**
- `server/integrations/lightning.ts` — Lightning AI wrapper
- `server/routers/batch.ts` — tRPC procedures
- `client/src/pages/BatchModeConfig.tsx` — React UI

---

### Phase 15: Advanced Analytics
**Duration:** 8–10 days  
**Modules:** Real-time dashboard, ML forecasting

- [ ] Real-time dashboard
- [ ] Cohort analysis
- [ ] Funnel tracking
- [ ] Churn prediction
- [ ] Revenue forecasting
- [ ] A/B test results
- [ ] Custom reports
- [ ] Vitest tests (12+ tests)

**Files to create:**
- `server/routers/analytics.ts` — tRPC procedures
- `client/src/pages/AdvancedAnalytics.tsx` — React UI

---

## 🎨 UI/UX Enhancements

### Timeline Editor UI
- [ ] Drag-and-drop clip arrangement
- [ ] Real-time preview pane
- [ ] Effect library (transitions, overlays, color grading)
- [ ] Watermark preview
- [ ] Keyboard shortcuts (spacebar play, delete clip, etc.)
- [ ] Undo/redo stack

### Multi-platform Dashboard
- [ ] Platform selector (checkboxes)
- [ ] Schedule calendar (week/month view)
- [ ] Metrics heatmap (performance by platform)
- [ ] Bulk actions (schedule multiple posts)
- [ ] Drag-and-drop scheduling

### Chatbot Config UI
- [ ] Personality selector (6 modes)
- [ ] Response template builder
- [ ] PPV menu editor (drag-reorder items)
- [ ] Voice note preview
- [ ] Conversation history viewer

### Monetization Dashboard
- [ ] Revenue chart (line/bar)
- [ ] Top content table (sortable)
- [ ] Subscriber growth chart
- [ ] PPV conversion funnel
- [ ] Revenue forecast chart

---

## 🧪 Testing Requirements

### Unit Tests
- [ ] All tRPC procedures (80+ tests)
- [ ] All agents (25+ tests)
- [ ] All integrations (30+ tests)
- [ ] DB helpers (15+ tests)
- [ ] Utility functions (20+ tests)

### Integration Tests
- [ ] Timeline editor → FFmpeg rendering
- [ ] Multi-platform posting → metrics aggregation
- [ ] Chatbot → Fanvue webhook → response
- [ ] Launch sequencer → daily executor
- [ ] MAGS agents → orchestrator

### E2E Tests
- [ ] Full project creation → posting → metrics
- [ ] Channel blueprint → video generation → YouTube upload
- [ ] Launch sequence → 14-day execution
- [ ] Monetization → PPV sale → revenue tracking

---

## 📊 Performance Targets

| Operation | Target | Current |
|---|---|---|
| Video generation | < 30s | ✓ Kling |
| PDF export | < 10s | ✓ Puppeteer |
| Multi-platform posting | < 5s | ⏳ TBD |
| MAGS cycle | < 2min | ✓ 90s avg |
| Dashboard load | < 2s | ✓ 1.2s avg |
| Timeline render | < 60s | ⏳ TBD |
| Chatbot response | < 3s | ⏳ TBD |

---

## 🔐 Security Checklist

- [ ] All API keys in env variables (never in code)
- [ ] OAuth tokens encrypted in DB
- [ ] Webhook signature verification (Fanvue, YouTube)
- [ ] Rate limiting on all endpoints
- [ ] CORS properly configured
- [ ] SQL injection prevention (Drizzle ORM)
- [ ] XSS prevention (React escaping)
- [ ] CSRF tokens on forms
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive data

---

## 📚 Documentation to Write

- [ ] Timeline Editor user guide
- [ ] Multi-platform setup guide (per platform)
- [ ] Chatbot personality guide
- [ ] Launch sequencer templates
- [ ] API reference (all new endpoints)
- [ ] Database schema documentation
- [ ] Deployment checklist
- [ ] Troubleshooting guide

---

## 🚀 Deployment Checklist

Before each checkpoint:
- [ ] All tests passing (vitest)
- [ ] TypeScript compilation (0 errors)
- [ ] No console errors/warnings
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Database migrations tested
- [ ] API integrations tested
- [ ] UI responsive on mobile
- [ ] Documentation updated
- [ ] Checkpoint created + versioned

---

## 📅 Timeline Estimate

| Phase | Duration | Start | End |
|---|---|---|---|
| Phase 6 (Timeline) | 8–10d | Week 1 | Week 2 |
| Phase 7 (Multi-platform) | 12–15d | Week 2 | Week 4 |
| Phase 8 (Chatbot) | 10–12d | Week 4 | Week 6 |
| Phase 9 (Trending Audio) | 6–8d | Week 6 | Week 7 |
| Phase 10 (Re-Creation) | 8–10d | Week 7 | Week 8 |
| Phase 11 (Monetization) | 6–8d | Week 8 | Week 9 |
| Phase 12 (Launch Seq) | 10–12d | Week 9 | Week 11 |
| Phase 13 (Lightning AI) | 6–8d | Week 11 | Week 12 |
| Phase 14 (Analytics) | 8–10d | Week 12 | Week 13 |
| **Total** | **~90 days** | | **Q3 2026** |

---

## 🎯 Success Metrics

### By Phase Completion
- Phase 6: 1 video project → 1 rendered timeline output
- Phase 7: 1 video → posted on 5 platforms simultaneously
- Phase 8: 10 chatbot conversations → 3+ PPV sales
- Phase 9: 100 trending audios detected → 20+ applied to projects
- Phase 10: 5 viral videos → 5 recreated videos
- Phase 11: $1000+ monthly revenue tracked across platforms
- Phase 12: 14-day launch sequence → 100+ followers
- Phase 13: 50% cost reduction on batch video generation
- Phase 14: Revenue forecast accuracy > 85%

---

## 💡 Future Enhancements (Post-v2.0)

- [ ] Live streaming integration (YouTube Live, TikTok Live)
- [ ] Community management (auto-reply, moderation)
- [ ] Influencer marketplace (hire creators)
- [ ] White-label solution (resell to agencies)
- [ ] Mobile app (iOS/Android)
- [ ] API for third-party integrations
- [ ] Advanced ML (churn prediction, content recommendation)
- [ ] Blockchain (NFT drops, token rewards)

---

## 🔗 Related Projects

- **story_liner** — Professional video editing (timeline, effects)
- **TS Mommy Ecosystem** — AI influencer automation (multi-platform, monetization)
- **MAGS** — Multi-agent growth system (optimization, decisions)

---

**Last Updated:** June 2026  
**Maintained By:** PejtrView  
**Status:** Active Development


## Higgsfield Connector Integration (NEW)
**Duration:** 6–8 days  
**Modules:** Higgsfield API, SoulID, CinematicID, video import

### Phase 16: Higgsfield Integration
- [ ] DB: higgsfield_videos table (videoId, title, description, thumbnail, duration, metadata JSON)
- [ ] DB: higgsfield_settings table (userId, apiKey, lastSync, syncStatus)
- [ ] DB: soulid_profiles table (videoId, soulIdConfig JSON, enabled, appliedAt)
- [ ] DB: cinematic_settings table (videoId, cinematicConfig JSON, enabled, appliedAt)
- [ ] DB: run migration for Higgsfield tables
- [ ] Backend: Higgsfield API client (auth, listVideos, getVideoDetails, applyEffects)
- [ ] Backend: SoulID wrapper (consistency detection, profile creation, application)
- [ ] Backend: CinematicID wrapper (cinematic enhancement, color grading, effects)
- [ ] Backend: Video history loader (fetch all videos from Higgsfield account)
- [ ] Backend: tRPC procedures (listHiggsieldVideos, importVideo, applySoulID, applyCinematicID, syncHistory)
- [ ] Frontend: HiggsieldIntegration.tsx page (video gallery, import buttons, feature toggles)
- [ ] Frontend: SoulID config panel (character consistency settings)
- [ ] Frontend: CinematicID config panel (cinematic enhancement settings)
- [ ] Frontend: Video import workflow (select → apply features → render)
- [ ] Tests: Higgsfield API client (8+ tests)
- [ ] Tests: SoulID/CinematicID wrappers (10+ tests)
- [ ] Tests: tRPC procedures (8+ tests)

**Files to create:**
- `server/integrations/higgsfield.ts` — Higgsfield API client
- `server/integrations/soulid.ts` — SoulID wrapper
- `server/integrations/cinematicid.ts` — CinematicID wrapper
- `server/routers/higgsfield.ts` — tRPC procedures
- `client/src/pages/HiggsieldIntegration.tsx` — React UI
- `client/src/components/SoulIDPanel.tsx` — SoulID config
- `client/src/components/CinematicIDPanel.tsx` — CinematicID config
- `drizzle/migrations/0015_higgsfield_tables.sql` — DB schema
- `server/higgsfield.test.ts` — Tests


---

## 🔬 MATRIX LAB — Automated AI Character Framework
**Status:** Specification Complete  
**Location:** `docs/MATRIX_LAB.md`  
**Priority:** High (Future Platform Feature)  
**Estimated Timeline:** 12 weeks  
**Team Size:** 4–5 engineers  

### Key Features
- LoRA training pipeline (Z-Image-Turbo base model)
- Automated checkpoint evaluation & selection
- ComfyUI generation workflows (free + premium tiers)
- Character specializations (selfie, fashion, NSFW modes)
- Multi-character batch training
- RunPod GPU infrastructure management
- REST API for third-party integration

### Phase 1: Core Infrastructure (Weeks 1–2)
- [ ] RunPod integration + template management
- [ ] LoRA training orchestrator
- [ ] Checkpoint evaluation system
- [ ] S3 storage setup
- [ ] Database schema (characters, LoRAs, training jobs, generation jobs)

### Phase 2: Training Pipeline (Weeks 3–4)
- [ ] Dataset upload & validation
- [ ] Automatic image preprocessing
- [ ] LoRA training executor
- [ ] Checkpoint comparison & selection
- [ ] Quality scoring system

### Phase 3: Generation Pipeline (Weeks 5–6)
- [ ] ComfyUI workflow templates
- [ ] Prompt processing & trigger word injection
- [ ] Generation job queue
- [ ] Post-processing pipeline
- [ ] Output gallery & distribution

### Phase 4: Web UI (Weeks 7–8)
- [ ] Character studio (upload, manage, view)
- [ ] Training dashboard (job status, metrics, checkpoint selection)
- [ ] Generation interface (prompt, style, batch options)
- [ ] Gallery & analytics
- [ ] Settings & specialization config

### Phase 5: Advanced Features (Weeks 9–10)
- [ ] Batch character training (10+ characters simultaneously)
- [ ] Multi-character generation (group photos)
- [ ] API for third-party integration
- [ ] Webhook notifications
- [ ] Advanced analytics & reporting

### Phase 6: Optimization & Scale (Weeks 11–12)
- [ ] Performance optimization (caching, parallel processing)
- [ ] Cost optimization (spot instances, batch scheduling)
- [ ] Monitoring & alerting
- [ ] Documentation & training
- [ ] Production deployment

---

## 📝 Documentation Files

- `README.md` — Main project documentation
- `docs/ARCHITECTURE.md` — System architecture & design patterns
- `docs/MATRIX_LAB.md` — MATRIX LAB framework specification
- `CLAUDE_CODE_COORDINATION.md` — Claude Code development guidelines


## Phase 17: SCAIL-2 GGUF Motion Transfer (NEW)
**Duration:** 10–12 days  
**Modules:** ComfyUI workflow, Wan 2.1 motion transfer, SAM3.1 masking, GGUF quantization

### Overview
SCAIL-2 GGUF Motion Transfer enables **character animation from driving videos** with:
- ✅ Automatic subject masking (SAM3.1) — no manual rotoscoping
- ✅ GGUF quantization — runs on consumer GPUs (8GB VRAM)
- ✅ Chunked loop generation — unlimited video length (no 5s limit)
- ✅ Multi-GPU offloading — faster processing
- ✅ Seamless stitching — color-matched transitions

### Implementation Tasks

**Backend:**
- [ ] ComfyUI workflow integration (SCAIL-2 nodes)
- [ ] Wan 2.1 motion transfer model setup
- [ ] SAM3.1 automatic masking integration
- [ ] GGUF quantization wrapper (Q4_K_M format)
- [ ] Chunked loop generator (81-frame + 76-frame windows)
- [ ] Color matching algorithm for seamless stitching
- [ ] Multi-GPU offloading support
- [ ] tRPC procedures: `animateCharacter`, `transferMotion`, `generateChunkedVideo`
- [ ] Queue management for long-form video generation
- [ ] Error handling + fallback (if GPU memory insufficient)

**Frontend:**
- [ ] MotionTransferStudio.tsx page
  - [ ] Upload reference image (character)
  - [ ] Upload driving video (motion source)
  - [ ] Preview first 5 seconds
  - [ ] Generate full video button
  - [ ] Progress tracking (chunked generation)
  - [ ] Download MP4 button
- [ ] Integration with Timeline Editor (post-processing)
- [ ] MAGS MotionTransferAgent (auto-animate low-engagement videos)

**Database:**
- [ ] motion_transfer_projects table (reference_image, driving_video, output_video, status)
- [ ] motion_transfer_settings table (gpu_config, chunk_size, color_matching_threshold)
- [ ] Migration: 0015_motion_transfer_tables.sql

**MAGS Integration:**
- [ ] MotionTransferAgent — detects static videos, auto-animates with motion transfer
- [ ] Rules: video_duration < 5s OR engagement_rate < 2% → animate with motion transfer
- [ ] Decision: "Animate character with motion transfer from trending dance video"
- [ ] Auto-execution: generate → upload → track performance

**Tests:**
- [ ] Unit tests for chunked loop generator (10+ tests)
- [ ] Integration tests for SAM3.1 masking (5+ tests)
- [ ] E2E tests for motion transfer pipeline (8+ tests)
- [ ] Performance tests (GPU memory, generation time)

**Files to Create:**
- `server/integrations/scail2.ts` — SCAIL-2 ComfyUI wrapper
- `server/integrations/wan21.ts` — Wan 2.1 motion transfer client
- `server/integrations/sam31.ts` — SAM3.1 masking wrapper
- `server/agents/motionTransferAgent.ts` — MAGS agent
- `server/routers/motionTransfer.ts` — tRPC procedures
- `client/src/pages/MotionTransferStudio.tsx` — React UI
- `drizzle/migrations/0015_motion_transfer_tables.sql` — DB schema

### Use Cases

✅ **Virtual Influencers** — Animate AI-generated faces with real human motion  
✅ **Dance Videos** — Map TikTok dances onto any character  
✅ **Tutorial Videos** — Animate static diagrams with motion  
✅ **Character Animation** — Rapid prototyping without manual frame-by-frame animation  
✅ **Low-Engagement Rescue** — Auto-animate underperforming videos  

### Cost Analysis

| Operation | Cost | Frequency | Monthly |
|---|---|---|---|
| Wan 2.1 inference | $0.01/video | 10 videos/day | $3 |
| SAM3.1 masking | $0 (local) | Included | $0 |
| GPU compute (local) | $0 (amortized) | Included | $0 |
| **TOTAL** | | | **$3/měsíc** |

**vs. Traditional Animation:** $50–100/video = **97% savings**

### Performance Targets

- ✅ 10-min video generation: < 5 minutes (chunked)
- ✅ GPU memory: < 8GB (GGUF quantization)
- ✅ Seamless stitching: < 2 frame artifacts per transition
- ✅ Color matching accuracy: > 95%

### Integration with Existing System

1. **Timeline Editor** — post-process animated videos (effects, color grading)
2. **MAGS MotionTransferAgent** — autonomous animation of low-engagement videos
3. **ContentCalendarAgent** — auto-queue motion transfer videos
4. **Multi-platform** — distribute animated videos across YouTube, TikTok, Instagram
5. **Analytics** — track engagement lift from motion transfer

### ROI Projection

**100 uživatelů, 3 motion transfer videí/měsíc:**

| Metrika | Hodnota |
|---|---|
| Videí/měsíc | 300 |
| Náklady | $9 |
| Příjem (5× marže) | $45 |
| Profit | **$36** |
| **ROI** | **400%** |

### Recommendation

Implementuj jako **Phase 17** (po NotebookLM). Synergy:
- ResearchAgent (NotebookLM) → generuje script
- VideoAgent → detekuje underperforming videa
- MotionTransferAgent → animuje je
- ContentCalendarAgent → queue management
- Multi-platform → distribuce

**Výsledek: Autonomní animation factory pro nízké náklady.**


---

## Phase 18: Higgsfield Full Integration (NEW - PRIORITY A)
**Duration:** 9 days (5 iterace)  
**Modules:** Higgsfield MCP, generation history, advanced AI features

### Overview
**Higgsfield Integration** — Přinese plnou sílu Higgsfield do Video Factory:
- ✅ Image generation (Soul 2.0, Nano Banana, Seedream, Marketing Studio)
- ✅ Video generation (Seedance 2.0, Kling 3.0, Personal Clipper)
- ✅ 3D generation (image-to-3D, rigging, animation)
- ✅ Audio/TTS (Seed Audio, ElevenLabs, voice cloning)
- ✅ Advanced editing (upscaling, outpainting, background removal)
- ✅ Generation history (stažená z Higgsfield)
- ✅ Presets management
- ✅ Marketing Studio integration
- ✅ Higgsfield-style UI v Video Factory

### Iterace

#### Iterace 1: Higgsfield Sync & DB Schema (1 den)
**Cíl:** Stáhni historii z Higgsfield, vytvoř DB tabulky

- [ ] Stáhni historii generování z Higgsfield (show_generations + show_marketing_studio_generations)
- [ ] Vytvoř DB tabulky:
  - [ ] `higgsfield_generations` (id, userId, jobId, type, model, status, params, results, createdAt)
  - [ ] `higgsfield_presets` (id, userId, name, model, params, favorite, createdAt)
  - [ ] `higgsfield_assets` (id, userId, assetId, type, url, metadata, createdAt)
  - [ ] `higgsfield_voice_library` (id, userId, voiceId, voiceName, voiceType, metadata)
- [ ] Migrace: 0016_higgsfield_tables.sql
- [ ] tRPC procedura: `higgsfield.syncHistory()` — stáhni a ulož historii

#### Iterace 2: Core Generation API (2 dny)
**Cíl:** Image + Video generation procedury

- [ ] tRPC router: `server/routers/higgsfield.ts`
- [ ] Procedury:
  - [ ] `generateImage` — Soul 2.0, Nano Banana, Seedream, Marketing Studio
  - [ ] `generateVideo` — Seedance 2.0, Kling 3.0, Personal Clipper
  - [ ] `getGenerationStatus` — polling
  - [ ] `listGenerations` — historií s filtry
  - [ ] `deleteGeneration` — smazání
  - [ ] `favoriteGeneration` — oblíbené
- [ ] Error handling + retry logic
- [ ] Cost estimation
- [ ] Tests: 15+ test cases

#### Iterace 3: Advanced Features (2 dny)
**Cíl:** 3D, Audio, Upscaling, Effects

- [ ] Procedury:
  - [ ] `generate3D` — image-to-3D, multi-image-to-3D
  - [ ] `generateAudio` — TTS (Seed Audio, ElevenLabs)
  - [ ] `cloneVoice` — voice cloning
  - [ ] `upscaleImage` — image upscaling
  - [ ] `upscaleVideo` — video upscaling
  - [ ] `outpaintImage` — image extension
  - [ ] `removeBackground` — background removal
  - [ ] `analyzeVideo` — video analysis
- [ ] Presets management:
  - [ ] `listPresets` — filtrování dle modelu
  - [ ] `savePreset` — uložení vlastního presetu
  - [ ] `applyPreset` — aplikace presetu na generaci
  - [ ] `deletePreset`
- [ ] Tests: 20+ test cases

#### Iterace 4: UI Integration (3 dny)
**Cíl:** Higgsfield-style interface v Video Factory

- [ ] Nové stránky:
  - [ ] `/studio/generate-image` — Image generation UI
  - [ ] `/studio/generate-video` — Video generation UI
  - [ ] `/studio/generate-3d` — 3D generation UI
  - [ ] `/studio/audio-studio` — Audio/TTS UI
  - [ ] `/studio/generation-history` — Historií s filtry
  - [ ] `/studio/presets` — Presets manager
- [ ] Komponenty:
  - [ ] `GenerationCard` — zobrazení generace
  - [ ] `PresetSelector` — výběr presetu
  - [ ] `ParameterPanel` — nastavení parametrů
  - [ ] `GenerationGallery` — galerie s infinite scroll
  - [ ] `ProgressIndicator` — progress tracking
  - [ ] `CostEstimator` — odhad ceny
- [ ] Navigace:
  - [ ] Sidebar v Studio s generačními nástroji
  - [ ] Quick access k posledním generacím
  - [ ] Favorites management
- [ ] Dark/Light theme support
- [ ] Responsive design (mobile-first)

#### Iterace 5: Testing & Polish (1 den)
**Cíl:** Tests, error handling, GitHub push

- [ ] Unit tests: 50+ test cases
- [ ] Integration tests: 10+ scenarios
- [ ] E2E tests: key workflows
- [ ] Error handling:
  - [ ] Rate limiting
  - [ ] Timeout handling
  - [ ] Fallback strategies
  - [ ] User-friendly error messages
- [ ] Performance:
  - [ ] Caching (Redis)
  - [ ] Pagination
  - [ ] Lazy loading
- [ ] Documentation:
  - [ ] API docs
  - [ ] UI guide
  - [ ] Troubleshooting
- [ ] GitHub push:
  - [ ] Checkpoint
  - [ ] Sync to main branch

### Database Schema

```sql
-- Higgsfield generations
CREATE TABLE higgsfield_generations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  jobId VARCHAR(255) UNIQUE NOT NULL,
  type ENUM('image', 'video', '3d', 'audio') NOT NULL,
  model VARCHAR(128) NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  params JSON,
  results JSON,
  costUsd FLOAT,
  processingTimeSeconds INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Higgsfield presets
CREATE TABLE higgsfield_presets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  model VARCHAR(128) NOT NULL,
  params JSON NOT NULL,
  favorite BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Higgsfield assets library
CREATE TABLE higgsfield_assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  assetId VARCHAR(255) UNIQUE,
  type ENUM('image', 'video', '3d', 'audio', 'preset') NOT NULL,
  url VARCHAR(512),
  metadata JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Voice library
CREATE TABLE higgsfield_voice_library (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  voiceId VARCHAR(255) UNIQUE,
  voiceName VARCHAR(255),
  voiceType ENUM('preset', 'cloned', 'element') DEFAULT 'preset',
  metadata JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### tRPC Router Structure

```typescript
higgsfield: {
  // Sync & History
  syncHistory: () => Promise<{ synced: number }>
  listGenerations: (filter) => Promise<Generation[]>
  getGeneration: (jobId) => Promise<Generation>
  deleteGeneration: (jobId) => Promise<void>
  favoriteGeneration: (jobId, favorite) => Promise<void>
  
  // Image Generation
  generateImage: (prompt, model, params) => Promise<{ jobId }>
  // Image models: soul_2, nano_banana_pro, seedream_4_5, marketing_studio_image
  // Seedream: SOTA photorealistic images, best for product/fashion/editorial
  
  // Video Generation
  generateVideo: (prompt, model, params) => Promise<{ jobId }>
  
  // 3D Generation
  generate3D: (image, model, params) => Promise<{ jobId }>
  
  // Audio/TTS
  generateAudio: (text, voice, params) => Promise<{ jobId }>
  cloneVoice: (audioUrl) => Promise<{ voiceId }>
  listVoices: () => Promise<Voice[]>
  
  // Advanced Features
  upscaleImage: (imageUrl, scale) => Promise<{ jobId }>
  upscaleVideo: (videoUrl, scale) => Promise<{ jobId }>
  outpaintImage: (imageUrl, params) => Promise<{ jobId }>
  removeBackground: (imageUrl) => Promise<{ jobId }>
  analyzeVideo: (videoUrl, prompt) => Promise<{ analysis }>
  
  // Presets
  listPresets: (model?) => Promise<Preset[]>
  savePreset: (name, model, params) => Promise<Preset>
  applyPreset: (presetId, overrides?) => Promise<{ jobId }>
  deletePreset: (presetId) => Promise<void>
  
  // Status & Cost
  getJobStatus: (jobId) => Promise<JobStatus>
  estimateCost: (model, params) => Promise<{ costUsd }>
}
```

### Use Cases

✅ **Complete AI Studio** — Všechny AI generační nástroje na jednom místě  
✅ **Workflow Integration** — Generuj → Edituj → Publikuj  
✅ **History & Favorites** — Vrať se k oblíbeným generacím  
✅ **Presets & Automation** — Ulož nastavení, opakuj generace  
✅ **Multi-modal** — Image → Video → 3D → Audio  
✅ **Cost Optimization** — Sleduj výdaje, optimalizuj model selection  

### ROI & Metrics

| Metrika | Hodnota |
|---|---|
| **Nové funkce** | 30+ procedur |
| **Nové stránky** | 6 pages |
| **Nové komponenty** | 8 components |
| **Test coverage** | 80%+ |
| **Implementační čas** | 9 dní |
| **Komplexita** | Vysoká (MAGS-level) |

### Doporučení

Implementuj **sekvenciálně** (Iterace 1→2→3→4→5):
1. Nejdřív DB + sync (foundation)
2. Pak core generation (value)
3. Pak advanced features (differentiation)
4. Pak UI (experience)
5. Pak testing + deployment

**Alternativa:** Paralelní Iterace 2+3 (pokud máš kapacitu)


---

## Seedream Image Generation — Model Comparison

### Seedream 4.5 (NEW)
**Best for:** Photorealistic, product photography, fashion, editorial, high-quality stills

| Aspekt | Seedream 4.5 | Nano Banana Pro | Soul 2.0 |
|---|---|---|---|
| **Kvalita** | ⭐⭐⭐⭐⭐ Fotorealistická | ⭐⭐⭐⭐ Velmi dobrá | ⭐⭐⭐⭐⭐ Identita |
| **Fotorealizmus** | Excelentní | Dobrý | Střední |
| **Detaily** | Vysoké | Vysoké | Střední |
| **Konzistence** | Nižší (bez identity) | Střední | Excelentní (identity) |
| **Cena** | $0.03/image | $0.02/image | $0.02/image |
| **Use Case** | Produkty, móda, editoriales | Všeobecné | Postavy, avatary |
| **Čas** | 15-20s | 10-15s | 10-15s |

### Implementace v Phase 18

**Seedream v `generateImage` proceduře:**
```typescript
generateImage: protectedProcedure
  .input(z.object({
    prompt: z.string(),
    model: z.enum(['soul_2', 'nano_banana_pro', 'seedream_4_5', 'marketing_studio_image']),
    params: z.object({
      aspectRatio: z.string().optional(), // 1:1, 16:9, 9:16, etc
      style: z.string().optional(), // photorealistic, artistic, cinematic
      quality: z.enum(['low', 'medium', 'high']).optional(),
      seed: z.number().optional(),
    }).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    // Route to correct model handler
    if (input.model === 'seedream_4_5') {
      return generateImageSeedream(ctx.user.id, input);
    }
    // ... other models
  })
```

**Seedream-specific wrapper:**
```typescript
async function generateImageSeedream(userId: number, input: {
  prompt: string;
  params?: { aspectRatio?: string; style?: string; quality?: string; seed?: number };
}) {
  // Call Higgsfield MCP: generate_image with model='seedream_4_5'
  // Track in higgsfield_generations table
  // Return jobId for polling
}
```

### Use Cases v Video Factory

1. **Product Videos** — Seedream pro product shots → Kling 3.0 pro animaci
2. **Fashion Content** — Seedream pro lookbook → Timeline Editor pro efekty
3. **Thumbnail Generation** — Seedream pro high-quality thumbnails
4. **Marketing Materials** — Seedream pro ads → Marketing Studio pro finalizaci
5. **Editorial Content** — Seedream pro fotografie → Seedance 2.0 pro videa

### ROI: Seedream Integration

| Metrika | Hodnota |
|---|---|
| **Nové image modely** | +1 (Seedream) |
| **Use cases** | +5 (product, fashion, editorial, ads, thumbnails) |
| **Cena** | $0.03/image (vs $0.05 pro tradiční fotograf) |
| **Kvalita lift** | +30% (fotorealizmus) |
| **Implementační čas** | +4 hodiny (Iterace 2) |

### Doporučení

Seedream by měl být **default model pro product/fashion content** v Phase 18 Iterace 2.


---

## Phase 18.5: Adult Content Management (NEW - PRIORITY A)
**Duration:** 3–4 days (integrated into Phase 18 Iterace 2–3)  
**Modules:** Age verification, content filtering, Fanvue/OnlyFans integration

### Overview
**Adult Content Workspace** — Bezpečné generování a distribuce adult obsahu:
- ✅ Age verification (18+ gate)
- ✅ Separate workspace (private, tagged)
- ✅ Nude/intimate scene generation (Soul 2.0, Seedream)
- ✅ Content filtering (hide from public)
- ✅ Fanvue/OnlyFans auto-posting
- ✅ Subscriber-only access
- ✅ Revenue tracking (premium pricing)
- ✅ Compliance & legal (terms of service)

### Implementation Tasks

#### Database Schema

```sql
-- Adult content workspace
CREATE TABLE adult_content_workspace (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  isVerified18Plus BOOLEAN DEFAULT FALSE,
  verificationDate TIMESTAMP,
  termsAccepted BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY user_id (userId)
);

-- Adult content projects
CREATE TABLE adult_content_projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  contentType ENUM('nude', 'intimate', 'sensual', 'artistic') NOT NULL,
  status ENUM('draft', 'generating', 'completed', 'published', 'archived') DEFAULT 'draft',
  
  -- Media
  thumbnailUrl TEXT,
  videoUrl TEXT,
  previewUrl TEXT,
  
  -- Distribution
  fanvuePostId VARCHAR(255),
  onlyFansPostId VARCHAR(255),
  publishedAt TIMESTAMP,
  
  -- Monetization
  subscriptionTier ENUM('free', 'basic', 'premium', 'vip') DEFAULT 'premium',
  priceUsd FLOAT,
  revenue FLOAT DEFAULT 0,
  
  -- Metadata
  metadata JSON,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  KEY userId (userId),
  KEY status (status),
  KEY contentType (contentType)
);

-- Adult content generation history
CREATE TABLE adult_content_generations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projectId INT NOT NULL,
  userId INT NOT NULL,
  prompt TEXT NOT NULL,
  model VARCHAR(128) NOT NULL,
  imageUrl TEXT,
  videoUrl TEXT,
  status ENUM('pending', 'generating', 'completed', 'failed') DEFAULT 'pending',
  costUsd FLOAT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriber access logs
CREATE TABLE adult_content_access_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projectId INT NOT NULL,
  subscriberId INT NOT NULL,
  accessedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  platform ENUM('fanvue', 'onlyfans', 'direct') DEFAULT 'direct'
);
```

#### tRPC Procedures

**Age Verification:**
- [ ] `verifyAge18Plus(termsAccepted: boolean)` — 18+ verification gate
- [ ] `getAdultWorkspaceStatus()` — check if user has adult workspace
- [ ] `createAdultWorkspace()` — initialize adult workspace

**Content Management:**
- [ ] `createAdultProject(title, description, contentType)` — new adult project
- [ ] `listAdultProjects(status?, limit?, offset?)` — list user's adult projects
- [ ] `getAdultProject(projectId)` — get project details
- [ ] `updateAdultProject(projectId, updates)` — edit project
- [ ] `deleteAdultProject(projectId)` — delete project
- [ ] `archiveAdultProject(projectId)` — archive (don't delete)

**Generation:**
- [ ] `generateAdultImage(projectId, prompt, model)` — nude/intimate image
  - Models: soul_2 (identity), seedream_4_5 (photorealistic)
  - Prompts: nude, intimate, sensual, artistic
- [ ] `generateAdultVideo(projectId, prompt, model)` — adult video
  - Models: kling_3_0 (motion), seedance_2_0 (full video)
- [ ] `getGenerationStatus(generationId)` — polling

**Distribution:**
- [ ] `publishToFanvue(projectId)` — auto-post to Fanvue
- [ ] `publishToOnlyFans(projectId)` — auto-post to OnlyFans
- [ ] `setSubscriptionTier(projectId, tier, priceUsd)` — pricing
- [ ] `trackSubscriberAccess(projectId, subscriberId)` — access logging

**Analytics:**
- [ ] `getAdultContentStats()` — revenue, views, subscribers
- [ ] `getProjectPerformance(projectId)` — per-project metrics
- [ ] `getRevenueByPlatform()` — Fanvue vs OnlyFans breakdown

#### Frontend Pages

- [ ] `/adult/verify` — Age verification (18+ gate)
- [ ] `/adult/workspace` — Adult content dashboard
- [ ] `/adult/create` — Create new adult project
- [ ] `/adult/projects` — List adult projects (private)
- [ ] `/adult/generate` — Generate nude/intimate content
- [ ] `/adult/distribution` — Fanvue/OnlyFans settings
- [ ] `/adult/analytics` — Revenue & subscriber tracking

#### Components

- [ ] `AgeVerificationGate.tsx` — 18+ verification modal
- [ ] `AdultProjectCard.tsx` — project card (private, tagged)
- [ ] `AdultGenerationPanel.tsx` — image/video generation UI
- [ ] `FanvueIntegration.tsx` — Fanvue posting settings
- [ ] `OnlyFansIntegration.tsx` — OnlyFans posting settings
- [ ] `SubscriberAccessLog.tsx` — access tracking UI
- [ ] `AdultAnalyticsDashboard.tsx` — revenue & metrics

#### Integration Points

**Fanvue API:**
- [ ] OAuth integration (connect Fanvue account)
- [ ] Post creation (auto-post adult videos)
- [ ] Subscriber tracking
- [ ] Revenue sync

**OnlyFans API:**
- [ ] OAuth integration (connect OnlyFans account)
- [ ] Post creation (auto-post adult videos)
- [ ] Subscriber tracking
- [ ] Revenue sync

**Content Filtering:**
- [ ] Mark projects as "Adult" in DB
- [ ] Hide from public feeds
- [ ] Show only to 18+ verified users
- [ ] Show only to subscribers (if gated)

#### Compliance & Legal

- [ ] Terms of Service (adult content clause)
- [ ] Age verification (18+ confirmation)
- [ ] GDPR compliance (EU users)
- [ ] CCPA compliance (CA users)
- [ ] Platform policies (Fanvue, OnlyFans)
- [ ] Content moderation (no illegal content)
- [ ] Tax reporting (1099 for US creators)

#### Tests

- [ ] Age verification tests (5+ tests)
- [ ] Adult project CRUD tests (8+ tests)
- [ ] Generation tests (10+ tests)
- [ ] Fanvue/OnlyFans integration tests (8+ tests)
- [ ] Access control tests (5+ tests)
- [ ] Compliance tests (5+ tests)

### Use Cases

✅ **OnlyFans Creator** — Generate exclusive nude content for subscribers  
✅ **Fanvue Performer** — Auto-post intimate videos to Fanvue  
✅ **Adult Content Studio** — Bulk generation + distribution  
✅ **Virtual Influencer** — AI-generated adult content (ethical, consensual)  
✅ **Premium Revenue** — $5–50/video (vs $0.01–0.10 for public)  

### Revenue Model

| Platform | Price/Video | Margin | Monthly (10 videos) |
|---|---|---|---|
| **Fanvue** | $10–50 | 70% | $700 |
| **OnlyFans** | $5–30 | 80% | $400 |
| **Direct** | $20–100 | 100% | $1000 |
| **TOTAL** | | | **$2100** |

**vs. Public Content:** $0.01–0.10/video = **21,000× higher revenue**

### ROI: Adult Content Module

| Metrika | Hodnota |
|---|---|
| **Nové procedury** | 20+ |
| **Nové stránky** | 7 pages |
| **Nové komponenty** | 7 components |
| **Implementační čas** | 3–4 dny |
| **Revenue lift** | 21,000× (premium pricing) |
| **Komplexita** | Střední (compliance-heavy) |

### Doporučení

**Adult Content Management by měl být:**
1. **Integrated do Phase 18 Iterace 2–3** (core generation)
2. **Separate workspace** (ne smíšeno s veřejným obsahem)
3. **18+ gated** (compliance + legal protection)
4. **Fanvue/OnlyFans first** (highest revenue platforms)
5. **Premium pricing** (10–100× vyšší než public content)

### Compliance Checklist

- [ ] Age verification implemented (18+ gate)
- [ ] Terms of Service updated (adult content clause)
- [ ] Privacy Policy updated (GDPR, CCPA)
- [ ] Content moderation (no illegal content)
- [ ] Payment compliance (Fanvue, OnlyFans ToS)
- [ ] Tax reporting (1099, W-9)
- [ ] Legal review (consult lawyer for jurisdiction)

### Next Steps

1. **Iterace 2.5:** Add Adult Content Management to Phase 18
2. **Iterace 3.5:** Fanvue/OnlyFans integration
3. **Iterace 4.5:** Adult content UI pages
4. **Iterace 5.5:** Testing + compliance review
5. **Launch:** Adult workspace (18+ only)


---

## Phase 17.5: Job Recovery & Timeout Handling (URGENT)
**Duration:** 2–3 days  
**Modules:** Stalled job detection, timeout handling, error recovery

### Problem
Video generation jobs get stuck in "processing" state without error or completion.

### Root Causes
1. **API timeout** — Kling/fal.ai takes > 30 min, no response
2. **Worker crash** — Background job dies without cleanup
3. **Database lock** — Status update fails, job frozen
4. **Network error** — Connection lost mid-generation
5. **No polling** — Frontend doesn't check status regularly

### Implementation

#### Database Schema Update
```sql
ALTER TABLE video_projects ADD COLUMN (
  processingStartedAt TIMESTAMP,
  lastStatusCheckAt TIMESTAMP,
  retryCount INT DEFAULT 0,
  maxRetries INT DEFAULT 3,
  errorLog JSON
);

CREATE TABLE job_recovery_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projectId INT NOT NULL,
  jobId VARCHAR(255),
  status ENUM('timeout', 'stalled', 'error', 'recovered', 'failed') NOT NULL,
  reason TEXT,
  action ENUM('retry', 'cancel', 'manual_review') DEFAULT 'retry',
  recoveredAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### tRPC Procedures
- [ ] `checkJobTimeout(projectId)` — detect stalled jobs (> 30 min)
- [ ] `retryFailedJob(projectId)` — retry with exponential backoff
- [ ] `cancelJob(projectId)` — cancel stuck job
- [ ] `getJobErrorLog(projectId)` — view error history
- [ ] `manualJobReview(projectId)` — admin override

#### Backend Services
- [ ] **JobMonitor** — Heartbeat cron (every 5 min)
  - Check all "processing" jobs
  - Detect timeouts (> 30 min)
  - Auto-retry with backoff (1 min, 5 min, 15 min)
  - Log recovery attempts
  - Notify user if failed
- [ ] **TimeoutHandler** — Cancel + cleanup
  - Release resources
  - Mark as failed
  - Suggest retry
- [ ] **ErrorRecovery** — Fallback strategies
  - Retry with different model
  - Reduce quality/duration
  - Use cached result if available

#### Frontend UI
- [ ] **Job Status Polling** — every 5 sec (not 30 sec)
- [ ] **Timeout Warning** — "Taking longer than expected..."
- [ ] **Cancel Button** — user can abort
- [ ] **Retry Button** — if failed
- [ ] **Error Details** — show actual error message

#### Tests
- [ ] Timeout detection (5+ tests)
- [ ] Retry logic (8+ tests)
- [ ] Error recovery (5+ tests)
- [ ] Database lock handling (3+ tests)

### Files to Create/Update
- [ ] `server/agents/jobMonitorAgent.ts` — Heartbeat monitor
- [ ] `server/services/jobRecovery.ts` — Recovery logic
- [ ] `server/routers/jobRecovery.ts` — tRPC procedures
- [ ] `client/src/hooks/useJobPolling.ts` — Frontend polling
- [ ] `client/src/components/JobStatusIndicator.tsx` — UI indicator
- [ ] `drizzle/migrations/0016_job_recovery.sql` — DB schema

### Priority
**CRITICAL** — Implement before Phase 18 launch (users are experiencing this NOW)
