# MAGS — Multi-Agent Autonomous Growth System
## Klíčové poznatky pro integraci s Video Factory + LeadOS

### Architektura
- **AgentBase** abstraktní třída: name, schedule, riskLevel, run(), applyRules(), analyzeWithAI(), executeDecision(), computeScore()
- **RulesEngine**: deterministická pravidla VŽDY před AI; priority-based, první match vyhrává
- **DecisionLog**: save/getPending/approve/reject/getHistory — každé rozhodnutí má reasoning, confidence 0-100
- **Orchestrator**: koordinuje agenty, sdílí SharedFunnelMetrics, agreguje do OrchestratorRun

### DB Tabulky (MAGS spec)
- `agent_decisions`: id, agent_name, run_id, decision_type(pause/scale/create/update/alert/approve/reject), source(rules/ai/hybrid), title, reasoning, impact, confidence, status(applied/pending/approved/rejected/superseded), metadata JSON, created_at, applied_at
- `agent_runs`: id, agent_name, run_id, status(success/error/skipped), duration_ms, decisions_count, applied_count, score, summary, metrics_snapshot JSON, error_message, created_at
- `orchestrator_runs`: id, run_id UNIQUE, triggered_by(cron/manual/leadOS/event), overall_score, total_decisions, applied_decisions, pending_decisions, summary, agent_results JSON, started_at, finished_at

### Agenti (přeloženo pro Video Factory)
1. **EmailAgent** → **VideoAgent**: optimalizuje video pipeline, detekuje stalled jobs
2. **AdsAgent** → **ChannelAgent**: optimalizuje YouTube kanály, CTR, engagement
3. **FunnelAgent** → **BlueprintAgent**: optimalizuje Channel Blueprint výkon
4. **ABTestAgent** → **ThumbnailABAgent**: řídí A/B testy thumbnailů
5. **SocialMediaAgent** → **ContentCalendarAgent**: udržuje posting queue, detekuje gaps
6. **CreativeAgent** → **ThumbnailCreativeAgent**: generuje a rotuje thumbnail kreativy
7. **AffiliateAgent** → (future)
8. **PricingAgent** → (future)

### LeadOS Orchestrace
#### Inbound webhooks (LeadOS → MAGS) POST /api/agents/webhook:
- `run_agent` — spustit konkrétního agenta s params
- `approve_decision` — schválit pending rozhodnutí (decision_id)
- `update_threshold` — přepsat threshold pravidla (agent, rule_id, new_value, reason)
- `get_report` — vyžádat full report (format: json/markdown/email)
- `run_full` — spustit full orchestrator cycle

#### Outbound events (MAGS → LeadOS) po každém cyklu:
```json
{
  "event_type": "mags_cycle_complete",
  "project_id": "video-factory",
  "overall_score": 72,
  "total_decisions": 14,
  "applied_decisions": 8,
  "pending_decisions": 6,
  "alerts": [...],
  "pending_approvals": [...],
  "dashboard_url": "https://..."
}
```

#### LeadOS Automation Rules příklady:
- IF overall_score < 40 → Send urgent alert + Pause campaigns + Schedule review
- IF pending_approvals contains PricingAgent → Send approval email s one-click links
- IF applied_decisions > 5 → Log to activity feed + Update health dashboard

### Admin Dashboard /admin/agents
- MAGS Command Center: Overall Health Score, [Run All], [Settings]
- Per-agent: score/100, actions count, [Trigger], [Details]
- Pending approvals queue s [Approve]/[Reject] tlačítky
- Decision history s reasoning

### Health Score Formula (Video Factory adaptace)
```
overallScore = (
  VideoAgent.score    × 0.30 +  // video pipeline = core
  ChannelAgent.score  × 0.25 +  // YouTube channel health
  ContentCalendarAgent.score × 0.20 + // posting consistency
  ThumbnailABAgent.score × 0.15 +    // A/B test performance
  BlueprintAgent.score × 0.10        // blueprint execution
)
```

### Co implementovat v Video Factory
1. **DB**: agent_decisions, agent_runs, orchestrator_runs tabulky
2. **Backend**: AgentBase třída + RulesEngine + DecisionLog
3. **Backend**: VideoAgent (detekuje stalled jobs, low quality scores)
4. **Backend**: ChannelAgent (YouTube CTR < threshold → alert, posting gap → auto-generate)
5. **Backend**: ContentCalendarAgent (posting queue < 3 → generate 7-day calendar)
6. **Backend**: ThumbnailABAgent (A/B winner detection, rotate losers)
7. **Backend**: AgentOrchestrator (cron každých 6h + LeadOS webhook trigger)
8. **Backend**: POST /api/agents/webhook (LeadOS inbound)
9. **Backend**: Outbound push do LeadOS po každém cyklu
10. **Frontend**: /admin/agents — MAGS Command Center dashboard
11. **Frontend**: Pending approvals queue s approve/reject
12. **Frontend**: Decision history timeline
