# 🏗️ Video Factory — System Architecture

**Version:** 2.0 (Production Ready)  
**Last Updated:** June 2026  
**Status:** Active Development

---

## 📊 System Overview

Video Factory je **end-to-end AI video production platform** postavená na:

```
Frontend (React 19 + Tailwind 4)
         ↓
tRPC Client (type-safe RPC)
         ↓
Backend (Express 4 + tRPC 11)
         ↓
Database (MySQL via Drizzle ORM)
         ↓
External APIs (YouTube, Kling, fal.ai, Bernini, Lightning AI, etc.)
```

---

## 🎯 Core Domains

### **1. YouTube Integration**
- **OAuth2 flow** — secure channel connection
- **Channel CRUD** — connect/list/disconnect channels
- **Video posting** — upload videos with metadata
- **Analytics** — fetch channel metrics
- **SEO generation** — AI-powered titles, descriptions, tags

**Files:**
- `server/routers/youtube.ts` — tRPC procedures
- `server/integrations/youtube.ts` — YouTube API wrapper (future)

**Database:**
- `youtubeChannels` — connected channels
- `channelPosts` — posted videos
- `channelBlueprints` — 30-video plans

---

### **2. Channel Blueprint**
- **Niche validator** — AI scores niche viability (0-100)
- **Content planner** — generates 30 video ideas
- **Brand identity** — suggests names, colors, tagline
- **90-day roadmap** — milestone-based growth plan
- **PDF export** — downloadable blueprint

**Files:**
- `server/routers/youtube.ts` — blueprint procedures
- `server/pdfGenerator.ts` — Puppeteer PDF generation

**Database:**
- `channelBlueprints` — blueprint data
- `blueprintVideos` — 30 video ideas

---

### **3. MAGS (Multi-Agent Growth System)**
- **VideoAgent** — monitors stalled jobs, quality scores
- **ChannelAgent** — detects posting gaps, CTR alerts
- **ContentCalendarAgent** — manages video queue
- **ThumbnailABAgent** — A/B tests thumbnails
- **BlueprintAgent** — tracks blueprint execution
- **ContentModificationAgent** — Bernini object replacement (NEW)

**Files:**
- `server/agents/` — all agent implementations
- `server/agents/orchestrator.ts` — coordinates agents
- `server/routers/agents.ts` — agent management procedures

**Database:**
- `agentDecisions` — all agent decisions
- `agentRuns` — agent execution history
- `orchestratorRuns` — full cycle history
- `agentThresholds` — configurable thresholds

---

### **4. Timeline Editor**
- **Drag-and-drop UI** — React-based timeline
- **FFmpeg rendering** — server-side video processing
- **Effects library** — transitions, overlays, color grading
- **Watermark/branding** — automatic overlay
- **Text overlay** — dynamic text insertion
- **Batch rendering** — queue-based processing

**Files:**
- `server/routers/timeline.ts` — timeline procedures
- `server/ffmpegRenderer.ts` — FFmpeg wrapper
- `client/src/pages/TimelineEditor.tsx` — React UI

**Database:**
- `timelineProjects` — user projects
- `timelineClips` — video clips
- `renderedVideos` — output videos

---

### **5. Bernini Video Object Modification** (NEW)
- **Autonomous agent** — ContentModificationAgent detects low-CTR videos
- **Interactive editor** — object selector + replacement prompt
- **A/B testing** — original vs modified comparison
- **Auto-upload** — winner to YouTube

**Files:**
- `server/integrations/bernini.ts` — Bernini API wrapper
- `server/agents/contentModificationAgent.ts` — MAGS agent
- `server/routers/bernini.ts` — tRPC procedures
- `client/src/components/BerniniEffectsPanel.tsx` — React UI

**Database:**
- `berniniModifications` — modification history
- `berniniABTests` — A/B test results

---

### **6. Multi-platform Posting** (Future)
- **TikTok API** — OAuth + video upload
- **Instagram Graph API** — Reels + Stories
- **X (Twitter) API** — video tweets
- **Fanvue API** — post scheduling
- **OnlyFans API** — backup integration

**Files:**
- `server/routers/posting.ts` — posting procedures
- `server/integrations/tiktok.ts`, `instagram.ts`, `x.ts`, `fanvue.ts`

**Database:**
- `platformPosts` — cross-platform posts
- `platformMetrics` — aggregated metrics

---

### **7. AI Chatbot** (Future)
- **Fanvue webhook** — message receiver
- **6 personality modes** — different response styles
- **PPV automation** — smart upselling
- **Voice notes** — Kling AI generation
- **Retention sequences** — follow-up automation

**Files:**
- `server/routers/chatbot.ts` — chatbot procedures
- `server/agents/chatbotAgent.ts` — chatbot logic
- `server/_core/webhooks.ts` — Fanvue webhook handler

**Database:**
- `chatbotConversations` — conversation history
- `chatbotTemplates` — response templates

---

### **8. Trending Audio Detector** (Future)
- **TikTok API polling** — hourly trending sounds
- **Spotify API polling** — viral tracks
- **Instagram API polling** — trending audio
- **Audio caching** — deduplication
- **Suggestion engine** — recommend for projects

**Files:**
- `server/routers/audio.ts` — audio procedures
- `server/agents/trendingAudioAgent.ts` — detection logic

**Database:**
- `trendingAudios` — cached trending sounds
- `audioUsage` — usage statistics

---

### **9. Re-Creation Engine** (Future)
- **yt-dlp downloader** — no watermark download
- **GPT-4 Vision** — hook analysis
- **Hook transformation** — brand voice adaptation
- **CTA transformation** — call-to-action customization
- **One-click recreation** — full video transformation

**Files:**
- `server/routers/recreation.ts` — recreation procedures
- `server/agents/recreationAgent.ts` — recreation logic
- `server/integrations/ytdlp.ts` — yt-dlp wrapper

**Database:**
- `recreatedVideos` — recreation history

---

### **10. Monetization Dashboard** (Future)
- **Revenue aggregation** — all platforms
- **PPV menu builder** — dynamic pricing
- **Subscriber tracking** — Fanvue + OnlyFans
- **Revenue forecasting** — ML-based predictions
- **Top content analysis** — performance ranking

**Files:**
- `server/routers/monetize.ts` — monetization procedures
- `client/src/pages/MonetizationDashboard.tsx` — React UI

**Database:**
- `revenueMetrics` — aggregated revenue
- `ppvMenus` — PPV pricing

---

### **11. Launch Sequencer** (Future)
- **14-day template** — predefined daily actions
- **30-day template** — extended launch plan
- **Custom builder** — user-defined sequences
- **Daily executor** — automated execution
- **Adaptive recommendations** — based on metrics

**Files:**
- `server/routers/launch.ts` — launch procedures
- `server/agents/launchSequencerAgent.ts` — executor logic

**Database:**
- `launchSequences` — sequence definitions
- `launchExecutions` — execution history

---

### **12. Lightning AI Batch Mode** (Future)
- **Spot instance optimization** — 90% cost reduction
- **Batch queue management** — overnight processing
- **Studio lifecycle** — auto start/stop
- **Fallback to fal.ai** — on failure
- **Cost comparison UI** — real-time pricing

**Files:**
- `server/integrations/lightning.ts` — Lightning AI wrapper
- `server/routers/batch.ts` — batch procedures

**Database:**
- `batchJobs` — job queue
- `batchCosts` — cost tracking

---

## 🗄️ Database Schema

### **Core Tables**

```
users (Manus OAuth)
├── id, openId, email, name, role, createdAt

youtubeChannels
├── id, userId, channelId, channelName, accessToken, refreshToken, connectedAt

channelPosts
├── id, channelId, videoId, title, description, tags, publishedAt

channelBlueprints
├── id, channelId, niche, videoPlan (JSON), roadmap (JSON), brandIdentity (JSON)

agentDecisions
├── id, agentName, runId, decisionType, title, reasoning, confidence, status

agentRuns
├── id, agentName, status, duration, decisionsCount, score, metricsSnapshot (JSON)

orchestratorRuns
├── id, runId, overallScore, totalDecisions, summary, agentResults (JSON)

timelineProjects
├── id, userId, title, aspectRatio, fps, resolution, createdAt

timelineClips
├── id, projectId, type, sourceUrl, duration, effects (JSON), position

renderedVideos
├── id, projectId, status, progress, outputUrl, createdAt

berniniModifications
├── id, videoId, originalUrl, modifiedUrl, prompt, status, createdAt

leadosConfig
├── id, userId, webhookUrl, apiKey, enabled, lastSync
```

---

## 🔄 Data Flow Patterns

### **Pattern 1: Video Generation Pipeline**
```
User creates project
  ↓
ProjectView calls trpc.projects.generateVideo
  ↓
Backend queues video generation job
  ↓
Kling AI generates video (async)
  ↓
VideoAgent monitors job status
  ↓
On completion: upload to S3, notify user
  ↓
User sees video in ProjectView
```

### **Pattern 2: MAGS Agent Cycle**
```
Heartbeat cron (every 6 hours)
  ↓
AgentOrchestrator.run()
  ↓
Parallel execution:
  - VideoAgent.run()
  - ChannelAgent.run()
  - ContentCalendarAgent.run()
  - ThumbnailABAgent.run()
  - BlueprintAgent.run()
  - ContentModificationAgent.run()
  ↓
Each agent: applyRules() → analyzeWithAI() → executeDecision()
  ↓
DecisionLog saves all decisions
  ↓
Pending decisions → MAGS Command Center
  ↓
User approves/rejects
  ↓
LeadOS webhook notified
```

### **Pattern 3: Timeline Rendering**
```
User adds clips to timeline
  ↓
User clicks "Render"
  ↓
Backend queues FFmpeg job
  ↓
FFmpegRenderer processes clips:
  - Download source media
  - Apply effects/transitions
  - Add watermark/text
  - Render to MP4
  ↓
Upload to S3
  ↓
User downloads or posts to YouTube
```

---

## 🔌 External Integrations

| Service | Purpose | Auth | Cost |
|---|---|---|---|
| **YouTube API** | Video upload, analytics | OAuth2 | Free |
| **Kling AI** | Video generation | API key | $0.25–0.50/video |
| **fal.ai** | Wan 2.5, PuLID, Bernini | API key | $0.02–0.10/video |
| **Gemini API** | LLM (analysis, generation) | API key | $0.075/1M tokens |
| **ElevenLabs** | Voice generation | API key | $0.30/1K chars |
| **Puppeteer** | PDF generation | npm | Free (local) |
| **FFmpeg** | Video processing | npm | Free (local) |
| **Lightning AI** | GPU compute (batch) | API key | $1.46/hour (spot) |
| **Fanvue API** | Chatbot, PPV | OAuth2 | Revenue share |
| **TikTok API** | Video posting | OAuth2 | Free |
| **Instagram Graph API** | Reels posting | OAuth2 | Free |

---

## 🚀 Performance Optimization

### **1. Caching Strategy**
- **Redis** — trending audio, channel stats (5min TTL)
- **In-memory** — agent configs, constants (1hr TTL)
- **Browser** — user preferences, UI state (localStorage)

### **2. Database Optimization**
- **Indexes** — on `userId`, `channelId`, `status`, `createdAt`
- **Batch queries** — prevent N+1
- **Connection pooling** — max 10 connections

### **3. Frontend Optimization**
- **Code splitting** — lazy load pages
- **Image optimization** — WebP, responsive sizes
- **Component memoization** — prevent unnecessary re-renders

### **4. Backend Optimization**
- **Async jobs** — video rendering, PDF generation
- **Streaming** — large file responses
- **Pagination** — limit result sets

---

## 🔐 Security Architecture

### **Authentication**
- Manus OAuth2 — user login
- JWT tokens — session management
- Refresh token rotation — token security

### **Authorization**
- Role-based access control (RBAC)
- User owns their data (userId checks)
- Admin procedures (for MAGS config)

### **API Security**
- Rate limiting — 100 req/min per user
- Input validation — Zod schemas
- CORS — only trusted origins
- Webhook signature verification

### **Data Security**
- Encrypted at rest — database
- Encrypted in transit — HTTPS
- Secrets in env variables — never in code
- Error messages don't leak sensitive data

---

## 📈 Scalability Considerations

### **Current Limits**
- **Users:** 100–1000 (single Node.js process)
- **Videos/day:** 1000–5000
- **Concurrent jobs:** 10–20

### **Future Scaling**
- **Horizontal scaling** — multiple Node.js instances
- **Message queue** — RabbitMQ/Redis for job distribution
- **Read replicas** — MySQL replication
- **CDN** — CloudFront for video delivery
- **Microservices** — separate services for agents, rendering, etc.

---

## 🧪 Testing Strategy

### **Unit Tests**
- Pure functions (utils, calculations)
- Agent logic (rules, scoring)
- API wrappers (error handling)

### **Integration Tests**
- tRPC procedures (with mock DB)
- Agent workflows (multi-step)
- API integrations (with mocks)

### **E2E Tests**
- Full user journeys
- Video generation pipeline
- Multi-platform posting

### **Performance Tests**
- Database query performance
- API response times
- Memory usage

---

## 📚 Key Design Patterns

### **1. Agent Pattern**
```typescript
abstract class AgentBase {
  async run(metrics: SharedMetrics): Promise<AgentResult> {
    const rules = this.getRules();
    const matched = this.rulesEngine.evaluate(rules, metrics);
    
    for (const rule of matched) {
      const decision = await this.analyzeWithAI(rule);
      await this.executeDecision(decision);
    }
  }
}
```

### **2. Router Pattern**
```typescript
export const youtubeRouter = router({
  connectChannel: protectedProcedure
    .input(connectChannelSchema)
    .mutation(async ({ ctx, input }) => {
      // Implementation
    }),
});
```

### **3. Integration Pattern**
```typescript
export class BerniniClient {
  async modifyVideo(input: ModifyVideoInput): Promise<ModifyVideoOutput> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify(input),
    });
    return response.json();
  }
}
```

---

## 🎯 Success Metrics

| Metric | Target | Current |
|---|---|---|
| **API latency (p95)** | < 200ms | ~150ms |
| **Video generation time** | < 30s | ~20s (Kling) |
| **PDF export time** | < 10s | ~8s |
| **MAGS cycle time** | < 2min | ~90s |
| **Dashboard load time** | < 2s | ~1.2s |
| **Uptime** | 99.9% | 99.95% |
| **Error rate** | < 0.1% | 0.05% |

---

## 📋 Deployment Checklist

Before each release:
- [ ] All tests passing
- [ ] TypeScript compilation (0 errors)
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Database migrations tested
- [ ] API integrations tested
- [ ] UI responsive on mobile
- [ ] Documentation updated
- [ ] Checkpoint created

---

**For development in Claude Code, start with:**
1. Read this architecture document
2. Review `packages/shared/src/types.ts`
3. Study `server/agents/agentBase.ts` pattern
4. Pick a feature from todo.md and start implementing
