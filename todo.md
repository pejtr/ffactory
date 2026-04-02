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

## FAL_API_KEY Integrace (v2.1)
- [x] FAL_API_KEY secret nastaven a ověřen
- [x] falai.ts: robustní error handling, isFalAvailable(), validateFalApiKey()
- [x] falai.ts: správné model ID pro Hailuo MiniMax (fal-ai/minimax/video-01-live/text-to-video)
- [x] falai.ts: správné model ID pro WAN 2.2 T2V (fal-ai/wan/v2.2/t2v) a I2V (fal-ai/wan/v2.2/i2v)
- [x] falai.ts: exponenciální backoff při pollingu (5s → 15s), timeout 10 minut
- [x] pipeline.ts: graceful fallback na Kling 3.0 když FAL není dostupný
- [x] pipeline.ts: detailní logging každé scény (model, výsledek)
- [x] routers.ts: models.status endpoint (Kling/Hailuo/WAN/ElevenLabs/Kie dostupnost)
- [x] routers.ts: models.validateFal endpoint pro ověření klíče
- [x] Studio.tsx: dynamický model status indikátor v kroku 3 (zelená/žlutá tečka)
- [x] ProjectView.tsx: oprava polling (všechny pipeline statusy: generating_screenplay, generating_audio, generating_scenes, assembling)
- [x] ProjectView.tsx: česká lokalizace všech textů
- [x] falai.test.ts: 16 testů pro fal.ai integraci (30/30 celkem passing)

## Higgsfield Soul + Kling Motion + Credits (v2.2)
- [x] DB schema: credits tabulka (balance, totalEarned, totalSpent, transactions)
- [x] DB schema: characters rozšíření (archivní pole, referenceImages, soulIdStyle, usageCount)
- [x] DB migrace: 0003_cheerful_hemingway.sql aplikována (6/6 příkazů OK)
- [x] db.ts: getUserCredits, getOrCreateCredits, spendCredits, earnCredits, getCreditTransactions
- [x] db.ts: CREDIT_COSTS (video=20, scene=3, soul_id=5), SIGNUP_BONUS=100
- [x] db.ts: updateCharacter, incrementCharacterUsage, addCharacterReferenceImage, removeCharacterReferenceImage
- [x] routers.ts: credits router (balance, history, costs, spend, earn, adminGrant)
- [x] routers.ts: characters.generateMotion (Kling Motion s pohybem kamery, 9 presetů)
- [x] routers.ts: characters.generateSoulId (credit check + AI generování portrétu)
- [x] routers.ts: characters.update (update jména, popisu, osobnosti, hlasu)
- [x] Characters.tsx: Soul Gallery archiv — grid karet s Soul ID portréty
- [x] Characters.tsx: MotionDialog — Kling Motion generátor s 9 pohybovými presety
- [x] Characters.tsx: foto upload pro referenční fotky (S3)
- [x] Characters.tsx: Soul ID generování s credit check
- [x] Credits.tsx: nová stránka s přehledem zůstatku, ceníkem a historií transakcí
- [x] CreditsWidget.tsx: sdílená komponenta — žlutý badge v navigaci (Home + Studio)
- [x] App.tsx: route /credits přidána
- [x] credits.test.ts: 14 testů pro credits systém a Kling Motion (44/44 celkem passing)

## Generate Hub v3.0 (Kling Motion Control + Kling Edit + Nano Banana 2 + Seedream 5)
- [ ] Backend: falai.ts rozšíření — nanoBanana2Generate, nanoBanana2Edit, seedream5Edit, klingVideoEdit
- [ ] Backend: kling.ts rozšíření — klingMotionControl (přenos pohybu z referenčního videa)
- [ ] Backend: routers.ts — generate router s procedurama pro všechny modely
- [ ] DB: generations tabulka (model, type, prompt, result_url, credits_cost, status)
- [ ] Frontend: GenerateHub stránka s tab navigací (Obrázky / Videa / Editace)
- [ ] Frontend: Nano Banana 2 karta (T2I + I2I edit)
- [ ] Frontend: Seedream 5 karta (multi-image edit)
- [ ] Frontend: Kling Motion Control karta (upload obrázku + referenční video)
- [ ] Frontend: Kling Edit karta (video-to-video s @Element/@Image referencemi)
- [ ] Navigace: přidat Generate Hub do Home.tsx a Studio.tsx
- [ ] Testy pro nové generate procedury
