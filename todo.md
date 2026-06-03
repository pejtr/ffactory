# Video Factory — Hollywood AI Studio TODO

## Phase 1: Database Schema & API Secrets
- [x] Add KLING_ACCESS_KEY and KLING_SECRET_KEY secrets
- [x] Add KIE_API_KEY secret (Music + unified)
- [x] Add ELEVENLABS_API_KEY secret
- [x] Add FAL_API_KEY secret (WAN 2.2, Hailuo, Pika via fal.ai)
- [x] Create DB schema: video_projects, scenes, characters, audio_tracks tables
- [x] Run DB migration

## Phase 2: Backend — Gemini Screenplay Engine
- [x] Implement Gemini screenplay generator (emotional arc, scene breakdown)
- [x] Implement smart scene router (dialogue → Kling Omni, B-roll → Hailuo, lip sync → WAN 2.2 S2V)
- [x] Implement Kling 3.0 Omni API (native audio + video, JWT auth)
- [x] Implement Hailuo MiniMax 2.3 API via fal.ai (cinematic B-roll)
- [x] Implement WAN 2.2 Speech-to-Video API via fal.ai (lip sync)
- [x] Implement Kling Motion Control API (character animation)
- [x] Implement Kie.ai Music generation API (Suno)
- [x] Implement ElevenLabs TTS + SFX + voice list API
- [x] Implement video pipeline orchestrator (scenes + audio parallel)
- [x] Implement project status/progress tracking (polling)

## Phase 3: Frontend — Hollywood Studio UI
- [x] Dark cinematic theme (Stargate Atlantis / Hollywood inspired)
- [x] Landing page with Video Factory hero section
- [x] Studio page: idea input, genre, emotion, duration, dream mode
- [x] Screenplay preview (scene breakdown, model badges, cost estimate)
- [x] Real-time project tracker (scene pipeline, status badges)
- [x] Characters page (Soul Cinema system)
- [x] Shareable video page (public link)
- [x] Cost estimator (show price before generating)

## Phase 0: Test Project — Stargate: Legacy (SG-1 + Atlantis + Universe tech)
- [ ] Design pilot episode: SG-1 & Atlantis characters discover Destiny-class long-range travel tech
- [ ] Story: O'Neill, Carter, Sheppard, McKay + new crew activate ancient long-range gate bridge
- [ ] Scene 1: SGC briefing room — dialogue (Kling 3.0 Omni native audio)
- [ ] Scene 2: Stargate activation + wormhole travel — cinematic B-roll (Hailuo MiniMax 2.3)
- [ ] Scene 3: Atlantis gate room — dialogue + emotion (Kling 3.0 Omni)
- [ ] Scene 4: Deep space — Destiny-class ship exterior (Hailuo MiniMax 2.3 B-roll)
- [ ] Scene 5: Alien encounter — action + motion control (Kling Motion Control)
- [ ] Scene 6: Emotional resolution — WAN 2.2 S2V lip sync
- [ ] BGM: Epic orchestral Hans Zimmer / Joel Goldsmith style (Kie.ai Music)
- [ ] Assemble pilot episode and generate shareable link

## Soul Cinema System (Higgsfield Soul alternative)
- [x] Character profile manager (name, description, personality, voice)
- [x] Soul ID generation via AI image generation (consistent character portrait)
- [x] Character voice assignment (ElevenLabs voice per character)
- [ ] Character consistency across scenes (reference image injection)
- [ ] Multi-character scenes (Sheppard + McKay + Carter in same frame)
- [ ] Emotion layer per character per scene
- [ ] Character memory (remembers appearance across entire episode)

## Phase 4: Tests & Polish
- [x] Vitest tests for all backend procedures (14/14 passing)
- [ ] Mobile responsive design polish
- [ ] Projects gallery / history dashboard
- [ ] Scene editor (manual override of model per scene)
- [ ] Checkpoint and deploy

## Soul Cinema — Referenční fotky
- [ ] Backend: S3 upload endpoint pro referenční fotky charakterů
- [ ] Backend: updateCharacterReferenceImage DB helper
- [ ] Frontend: drag&drop foto upload v Characters stránce
- [ ] Frontend: náhled nahraté fotky + možnost změnit
- [ ] Soul ID generátor používá referenční fotku jako základ

## Překlad do češtiny
- [ ] Home.tsx — česky
- [ ] Studio.tsx — česky
- [ ] ProjectView.tsx — česky
- [ ] Characters.tsx — česky
- [ ] SharedVideo.tsx — česky
- [ ] NotFound.tsx — česky

## AI Chatbot průvodce (Lucie)
- [ ] Backend: tRPC chatbot endpoint se streamingem (Gemini)
- [ ] Chatbot zná kontext aplikace (jak funguje pipeline, co jsou modely, Soul Cinema)
- [ ] Plovoucí chatbot panel (pravý dolní roh) — vždy dostupný
- [ ] Kontextové nápovědy dle aktuální stránky
- [ ] Krok-za-krokem průvodce: idea → screenplay → video → sdílení
- [ ] Navrhuje příkazy a tipy pro Stargate: Legacy pilot

## Intuitivní redesign (v2.0)
- [ ] Studio wizard: krok-za-krokem (Krok 1: Nápad → Krok 2: Styl → Krok 3: Scénář → Krok 4: Vytvořit)
- [ ] Vizuální progress indikátor kroků nahoře
- [ ] Inline nápovědy a placeholder texty v češtině
- [ ] Celé UI přeloženo do češtiny
- [ ] AI chatbot Lucie — plovoucí panel vpravo dole, streaming odpovědi
- [ ] Lucie zná celý kontext aplikace a navádí krok za krokem
- [ ] Soul Cinema: drag&drop foto upload s náhledem

## Soul Cinema — Multi-foto (v2.0)
- [ ] DB schema: referenceImages jako JSON array (až 5 fotek) + isMultiView flag
- [ ] Backend: upload endpoint pro více fotek najednou (S3) + detekce multi-view sheetu
- [ ] Frontend: multi-foto upload UI (přední pohled, boční, detail obličeje, různé výrazy, volitelná 5.)
- [ ] Podpora "character sheet" — jedna fotka se 4 záběry z různých úhlů (nejlepší konzistence)
- [ ] Automatické označení multi-view sheetu při uploadu
- [ ] Foto galerie s možností mazání jednotlivých fotek
- [ ] Soul ID generátor kombinuje všechny referenční fotky / character sheet pro maximální konzistenci
- [ ] Tip v UI: doporučení nahrát character sheet pro nejlepší výsledky

## Viral Score Widget + Hook Template Library (v2.5)
- [ ] Backend: story.sources.analyze vrací viralScore (0-10) + hookPatterns pole
- [ ] Backend: story.hooks.list + story.hooks.useInScript procedury
- [ ] DB: hook_templates tabulka (category, template, example, viralScore)
- [ ] Frontend: ViralScoreGauge SVG komponenta (kruhový gauge s animací)
- [ ] Frontend: Sources Manager - viral score badge + gauge pro každý zdroj
- [ ] Frontend: Hook Template Library panel v NotebookDetail (filtry, kategorie, copy-to-script)
- [ ] Frontend: Channel comparison view - porovnání viral score napříč zdroji

## Referral System (v3.0)
- [x] DB: add referral_code column to users table + create referrals table
- [x] DB: run migration 0007
- [x] Backend: referral router (getMyCode, getStats, applyCode)
- [x] Backend: register referral router in routers.ts
- [x] Backend: REFERRAL_REWARD constant (50 credits) in db.ts
- [x] Frontend: /referral page (link display, copy/share, stats, how-it-works)
- [x] Frontend: route + nav link "Pozvat přátele" in Home.tsx
- [x] OAuth: auto-apply referral code from URL param on new user registration
- [x] Tests: referral.test.ts
- [x] TypeScript: 0 errors check

## Persistence / Memory (v4.0)
- [ ] Studio form: save all wizard fields to localStorage on every change
- [ ] Studio form: restore fields on mount (per-user key)
- [ ] Studio form: clear localStorage after successful project creation
- [ ] ProjectView: remember last active project ID in localStorage
- [ ] ProjectView: auto-redirect to last project on Studio open if generating
- [ ] ProjectView: resume polling immediately after refresh if status is generating

## Cynema AI Features + Script Templates (v3.0)
- [ ] Scene-Based Editor — edit individual scenes after generation (prompt, model, duration, camera)
- [ ] Multi-format Export presets — 16:9 YouTube, 9:16 TikTok/Shorts, 1:1 Instagram
- [ ] Camera Motion presets — dolly, pan, tilt, orbit, FPV drone, handheld
- [ ] AI Sound Design — auto-select music + SFX based on scene mood
- [ ] Script Templates page — parametric templates with persona slots
- [ ] "The Trap & Switch" template — 6-scene horror micro-short with Character A/B slots
- [ ] Template Library — genre-based templates (horror, sci-fi, drama, comedy, educational)
- [ ] Persona Manager — save reusable character personas for quick template filling

## Channel Empire Mode — YouTube Automation (v5.0)
- [ ] DB: youtube_channels table (userId, channelId, accessToken, refreshToken, channelName, thumbnailUrl, createdAt)
- [ ] DB: channel_posts table (projectId, channelId, youtubeVideoId, publishedAt, status, scheduledAt, title, description, tags)
- [ ] DB: run migration 0010
- [ ] Backend: YouTube OAuth2 connect/disconnect procedures (PKCE flow, token refresh)
- [ ] Backend: channel manager CRUD (list, connect, disconnect, getChannelStats)
- [ ] Backend: SEO metadata AI generation (title, description, tags in target language via LLM)
- [ ] Backend: thumbnail generation (AI image from scene prompt + title overlay)
- [ ] Backend: YouTube resumable upload procedure (MP4 + thumbnail + metadata)
- [ ] Backend: multi-language pipeline (translate script to 5 languages + native ElevenLabs TTS)
- [ ] Frontend: Channel Manager page (/channels) — connect YouTube, manage channels, posting schedule, stats
- [ ] Frontend: Project publish flow — SEO preview, thumbnail preview, language selector, publish to YouTube button
- [ ] Frontend: nav link "Kanály" in Home.tsx
- [ ] Scheduled: Heartbeat cron job for daily video generation + auto-upload
- [ ] Tests: youtube.test.ts
- [ ] TypeScript: 0 errors check

## Channel Empire — Best Practices Integration (from YouTube automation video)

### Phase 1: Channel Blueprint AI Generator
- [x] Backend: youtube.generateBlueprint procedure — AI generates full 30-video content plan from niche
- [x] Backend: youtube.validateNiche procedure — checks Google Trends data for niche viability
- [x] Backend: youtube.generate90DayPlan procedure — milestone-based 90-day growth roadmap
- [x] DB: channel_blueprints table (channelId, niche, videoPlan JSON, roadmap JSON, brandIdentity JSON)
- [x] DB: run blueprint migration

### Phase 2: Enhanced SEO System
- [x] Backend: youtube.generateSEO enhanced — includes chapters/timestamps, hashtag block, CTA templates
- [x] Backend: youtube.generateThumbnailVariants — generates 2-3 A/B test thumbnail options
- [x] Backend: youtube.generateDescription — structured description with hook + bullet points + timestamps + hashtags
- [ ] Frontend: SEO Editor with live preview (title char count, description sections, tag pills)
- [ ] Frontend: Thumbnail A/B picker — show 3 variants, user picks or lets YouTube A/B test

### Phase 3: Channel Blueprint Wizard (5-Phase Pipeline UI)
- [x] Frontend: /channel-blueprint page — step-by-step wizard matching the 5-phase pipeline
- [x] Step 1: Niche Validator (input niche → AI validates demand + competition)
- [x] Step 2: Blueprint Generator (30 video ideas with SEO metadata for each)
- [x] Step 3: Brand Identity (AI logo + banner + channel name suggestions)
- [ ] Step 4: Video Production Queue (batch generate from blueprint topics)
- [ ] Step 5: Auto-Publish Pipeline (schedule + upload + SEO + thumbnail)

### Phase 4: Posting Cadence & Scheduler
- [ ] Backend: youtube.setPostingSchedule procedure — define cadence (daily/3x week/5x week)
- [ ] Backend: youtube.getNextScheduledSlots — returns upcoming posting slots
- [ ] Frontend: Posting Calendar view — visual weekly schedule with drag-drop videos
- [ ] Frontend: Cadence selector (1x/day, 3-5x/week) with AI recommendation

### Phase 5: Content Quality & Compliance
- [ ] Backend: youtube.checkUniqueness — AI validates video script is unique (not repetitive)
- [ ] Backend: youtube.policyCheck — flags potential YouTube policy violations before upload
- [ ] Frontend: Pre-publish checklist (uniqueness score, policy compliance, SEO completeness)
- [ ] Frontend: Warning badges on videos that may violate YouTube policies

### Phase 6: Video Length & Monetization Optimization
- [ ] Backend: optimal duration recommendation (8-10 min for monetization)
- [ ] Frontend: Duration advisor in Studio (warns if < 8 min for YouTube monetization)
- [ ] Frontend: Monetization tips panel (digital products, affiliate links, AdSense optimization)

## PDF Export — Channel Blueprint & Roadmap
- [x] Backend: youtube.exportBlueprintPdf procedure — generates PDF from blueprint data, returns S3 URL
- [x] Frontend: Export PDF button on Brand Identity phase (phase 3)
- [x] Frontend: Export PDF button on Video Plan phase (phase 4)
- [x] Frontend: Export PDF button on Roadmap phase (phase 5)
- [x] Frontend: "Export celý Blueprint" button — exports all phases into one PDF

## MAGS — Multi-Agent Autonomous Growth System + LeadOS Integration

### Phase 1 — DB Schema
- [x] DB: agent_decisions table (agent_name, run_id, decision_type, source, title, reasoning, impact, confidence, status, metadata JSON)
- [x] DB: agent_runs table (agent_name, run_id, status, duration_ms, decisions_count, applied_count, score, summary, metrics_snapshot JSON)
- [x] DB: orchestrator_runs table (run_id UNIQUE, triggered_by, overall_score, total_decisions, applied_decisions, pending_decisions, summary, agent_results JSON)
- [x] DB: agent_thresholds table (agent_name, rule_id, value, updated_by, reason, updated_at)
- [x] DB: run migration for all MAGS tables

### Phase 2 — Shared Infrastructure
- [x] server/agents/agentBase.ts — abstract AgentBase class (run, applyRules, analyzeWithAI, executeDecision, computeScore)
- [x] server/agents/rulesEngine.ts — RulesEngine<TMetrics> (register, evaluate, priority-based)
- [x] server/agents/decisionLog.ts — DecisionLog (save, getPending, approve, reject, getHistory)
- [x] server/agents/sharedMetrics.ts — SharedVideoMetrics (single DB query shared by all agents)

### Phase 3 — Agents
- [x] server/agents/videoAgent.ts — stalled jobs, quality scores, pipeline failures (schedule: every 1h)
- [x] server/agents/channelAgent.ts — posting gaps, CTR alerts, subscriber drops (schedule: every 6h)
- [x] server/agents/contentCalendarAgent.ts — queue management, auto-generate calendar (schedule: daily 20:00)
- [x] server/agents/thumbnailABAgent.ts — A/B winner detection, rotate losers (schedule: every 12h)
- [x] server/agents/blueprintAgent.ts — blueprint execution rate, niche decay (schedule: daily 08:00)

### Phase 4 — Orchestrator + LeadOS
- [x] server/agents/orchestrator.ts — AgentOrchestrator (parallel/sequential groups, health score, notifyOwner)
- [x] server/agents/orchestrator.ts — Heartbeat cron endpoint POST /api/scheduled/mags-orchestrator
- [x] server/routers/agents.ts — tRPC procedures (listDecisions, approveDecision, rejectDecision, triggerAgent, runFull, getReport, updateThreshold, getOrchestratorRuns)
- [x] POST /api/agents/webhook — LeadOS inbound (run_agent, approve_decision, reject_decision, get_report, run_full)
- [x] LeadOS outbound push — mags_cycle_complete event after each cycle

### Phase 5 — Admin Dashboard
- [x] Frontend: /admin/agents route registered in App.tsx
- [x] Frontend: AgentsDashboard.tsx — MAGS Command Center page
- [x] Frontend: Overall Health Score gauge (0-100) with color indicator
- [x] Frontend: Per-agent cards (score, last run, decisions count, [Trigger], [Details])
- [x] Frontend: Pending Approvals queue with [Approve] / [Reject] buttons
- [x] Frontend: Decision History timeline with reasoning + confidence
- [x] Frontend: [Run All] button for manual full cycle trigger
- [x] Frontend: LeadOS webhook URL configuration in Settings panel
- [x] Frontend: Nav link "🤖 MAGS" in Home.tsx header
