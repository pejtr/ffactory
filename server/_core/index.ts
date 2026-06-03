import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // ── MAGS — Heartbeat cron endpoint (every 6h orchestrator run) ────────────
  app.post("/api/scheduled/mags-orchestrator", async (req, res) => {
    try {
      const taskUid = req.headers["x-manus-cron-task-uid"] as string | undefined;
      console.log(`[MAGS Heartbeat] Triggered by cron (task_uid: ${taskUid ?? "unknown"})`);
      const { runOrchestrator } = await import("./agents/orchestrator" as any);
      const result = await (runOrchestrator as any)("cron");
      res.json({ ok: true, runId: result.runId, overallScore: result.overallScore });
    } catch (err: any) {
      console.error("[MAGS Heartbeat] Error:", err.message);
      res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
    }
  });

  // ── LeadOS inbound webhook — POST /api/agents/webhook ────────────────────
  app.post("/api/agents/webhook", async (req, res) => {
    try {
      const body = req.body as Record<string, unknown>;
      const action = body.action as string;
      console.log(`[LeadOS Webhook] Action: ${action}`);

      if (action === "run_full") {
        const { runOrchestrator } = await import("./agents/orchestrator" as any);
        const result = await (runOrchestrator as any)("leadOS");
        return res.json({ ok: true, runId: result.runId, overallScore: result.overallScore });
      }

      if (action === "approve_decision") {
        const { decisionLog } = await import("./agents/decisionLog" as any);
        await (decisionLog as any).approve(Number(body.decision_id), "leadOS");
        return res.json({ ok: true, approved: body.decision_id });
      }

      if (action === "reject_decision") {
        const { decisionLog } = await import("./agents/decisionLog" as any);
        await (decisionLog as any).reject(Number(body.decision_id), String(body.reason ?? "Rejected by LeadOS"));
        return res.json({ ok: true, rejected: body.decision_id });
      }

      if (action === "run_agent") {
        const agentName = body.agent as string;
        const { collectSharedMetrics } = await import("./agents/sharedMetrics" as any);
        const metrics = await (collectSharedMetrics as any)();
        const agentMap: Record<string, string> = {
          VideoAgent: "./agents/videoAgent",
          ChannelAgent: "./agents/channelAgent",
          ContentCalendarAgent: "./agents/contentCalendarAgent",
          ThumbnailABAgent: "./agents/thumbnailABAgent",
          BlueprintAgent: "./agents/blueprintAgent",
        };
        const modulePath = agentMap[agentName];
        if (!modulePath) return res.status(400).json({ error: `Unknown agent: ${agentName}` });
        const mod = await import(modulePath as any);
        const agentKey = agentName.charAt(0).toLowerCase() + agentName.slice(1);
        const result = await (mod as any)[agentKey].run(metrics);
        return res.json({ ok: true, agentName, score: result.score, decisionsCount: result.decisionsCount });
      }

      if (action === "get_report") {
        const { decisionLog } = await import("./agents/decisionLog" as any);
        const { getDb } = await import("./db" as any);
        const { orchestratorRuns } = await import("../drizzle/schema" as any);
        const { desc } = await import("drizzle-orm" as any);
        const db = await (getDb as any)();
        const latestRun = db ? await db.select().from(orchestratorRuns).orderBy(desc(orchestratorRuns.startedAt)).limit(1) : [];
        const decisions = await (decisionLog as any).getHistory(20);
        return res.json({ ok: true, latestRun: latestRun[0] ?? null, recentDecisions: decisions });
      }

      return res.status(400).json({ error: `Unknown action: ${action}` });
    } catch (err: any) {
      console.error("[LeadOS Webhook] Error:", err.message);
      res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
