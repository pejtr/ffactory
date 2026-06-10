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

### Phase 6: Timeline Editor (Story Liner integration)
**Duration:** 8–10 days  
**Modules:** FFmpeg wrapper, React UI, effects, rendering

- [ ] FFmpeg wrapper for server-side rendering
- [ ] React drag-and-drop timeline UI
- [ ] Clip trimming, transitions, effects
- [ ] Watermark + branding overlay
- [ ] Text overlay + color grading
- [ ] Real-time preview
- [ ] Batch rendering queue
- [ ] Performance optimization
- [ ] Vitest tests (15+ tests)

**Files to create:**
- `server/ffmpegRenderer.ts` — FFmpeg wrapper
- `server/routers/timeline.ts` — tRPC procedures
- `client/src/pages/TimelineEditor.tsx` — React UI
- `drizzle/migrations/0013_timeline_tables.sql` — DB schema

---

### Phase 7: Multi-platform Posting
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

### Phase 8: AI Chatbot (24/7 Monetization)
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

### Phase 9: Trending Audio Detector
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

### Phase 10: Re-Creation Engine
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

### Phase 11: Monetization Dashboard
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

### Phase 12: Launch Sequencer
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

### Phase 13: Lightning AI Batch Mode
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

### Phase 14: Advanced Analytics
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
