# Video Factory — Hollywood AI Studio TODO

## Phase 1: Database Schema & API Secrets
- [x] Add KLING_ACCESS_KEY and KLING_SECRET_KEY secrets
- [x] Add KIE_API_KEY secret (Music + unified)
- [x] Add ELEVENLABS_API_KEY secret
- [x] Add FAL_API_KEY secret (WAN 2.2, Hailuo, Pika via fal.ai)
- [x] Add GEMINI_API_KEY secret
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
- [x] Switch screenplay engine to direct Gemini REST API (fix usage exhausted error)
- [x] Optimize token usage: gemini-2.5-flash, short prompts
- [x] Update model routing: Kling 3.0 primary (90% scenes), Hailuo only for transitions

## Phase 3: Frontend — Hollywood Studio UI
- [x] Dark cinematic theme (Stargate Atlantis / Hollywood inspired)
- [x] Landing page with Video Factory hero section
- [x] Studio page: idea input, genre, emotion, duration, dream mode
- [x] Screenplay preview (scene breakdown, model badges, cost estimate)
- [x] Real-time project tracker (scene pipeline, status badges)
- [x] Characters page (Soul Cinema system)
- [x] Shareable video page (public link)
- [x] Cost estimator (show price before generating)
- [x] Moje Projekty page (project gallery with status, thumbnails, share)

## Soul Cinema System
- [x] Character profile manager (name, description, personality, voice)
- [x] Soul ID generation via AI image generation
- [x] Character voice assignment (ElevenLabs voice per character)
- [x] DB schema: referenceImages JSON array (up to 5 photos) + isMultiView flag
- [x] Backend: S3 upload endpoint for reference photos
- [x] Frontend: drag&drop photo upload with gallery and delete
- [x] Character sheet support (1 photo with 4 angles = best consistency)
- [x] Tip in UI: recommend character sheet for best results
- [ ] Character consistency across scenes (reference image injection into prompts)
- [ ] Multi-character scenes (multiple characters in same frame)

## Phase 0: Test Project — Stargate: Legacy (SG-1 + Atlantis + Universe tech)
- [ ] Design pilot episode: SG-1 & Atlantis characters discover Destiny-class long-range travel tech
- [ ] Create characters: O'Neill, Carter, Sheppard, McKay with Soul IDs
- [ ] Generate pilot episode scenes
- [ ] Assemble and share pilot episode link

## AI Chatbot Lucie
- [x] Backend: tRPC chatbot endpoint (Gemini-powered, Czech context)
- [x] Frontend: floating chatbot panel (bottom right, always accessible)
- [x] Streaming responses
- [x] Context-aware tips per page

## Překlad do češtiny
- [x] Characters.tsx — česky
- [x] Projects.tsx — česky
- [x] Home.tsx — česky
- [x] Studio.tsx — česky
- [x] ProjectView.tsx — česky
- [x] SharedVideo.tsx — česky

## Phase 4: Tests & Polish
- [x] Vitest tests for all backend procedures (14/14 passing)
- [x] AI chatbot Lucie floating panel
- [ ] Mobile responsive design polish
- [ ] Scene editor (manual override of model per scene)
- [ ] Checkpoint and deploy
