// ─── MAGS — Shared Video Metrics ─────────────────────────────────────────────
// One DB query shared by all agents in a cycle (MAGS principle: SharedFunnelMetrics)

import { getDb } from "../db";
import {
  videoProjects,
  youtubeChannels,
  channelPosts,
  channelBlueprints,
} from "../../drizzle/schema";
import { eq, sql, and, lt, gt, count } from "drizzle-orm";
import type { SharedVideoMetrics } from "./types";

export async function collectSharedMetrics(): Promise<SharedVideoMetrics> {
  const db = await getDb();
  const now = new Date();
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twentyFourHAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  if (!db) {
    // Return safe defaults when DB is unavailable
    return {
      totalProjects: 0, activeProjects: 0, stalledProjects: 0,
      failedProjectsLast24h: 0, avgQualityScore: 75, completedLast7d: 0,
      totalChannels: 0, channelsWithPostingGap: 0, avgCTR: 0,
      totalSubscribers: 0, subscriberDropChannels: 0,
      totalQueuedVideos: 0, channelsWithEmptyQueue: 0, avgPostingCadenceAdherence: 100,
      totalBlueprints: 0, activeBlueprints: 0, blueprintExecutionRate: 0,
      lowCTRVideos: 0, abTestsRunning: 0, abTestsWithWinner: 0,
      collectedAt: now,
    };
  }

  // Run all queries in parallel
  const [
    projectStats,
    channelStats,
    blueprintStats,
  ] = await Promise.all([
    // Video project stats
    db.select({
      total: count(),
      active: sql<number>`SUM(CASE WHEN status NOT IN ('completed','failed','cancelled') THEN 1 ELSE 0 END)`,
      stalled: sql<number>`SUM(CASE WHEN status NOT IN ('completed','failed','cancelled','draft') AND updated_at < ${thirtyMinAgo} THEN 1 ELSE 0 END)`,
      failedRecent: sql<number>`SUM(CASE WHEN status = 'failed' AND updated_at > ${twentyFourHAgo} THEN 1 ELSE 0 END)`,
      completedRecent: sql<number>`SUM(CASE WHEN status = 'completed' AND updated_at > ${sevenDaysAgo} THEN 1 ELSE 0 END)`,
    }).from(videoProjects),

    // Channel stats
    db.select({
      total: count(),
      withGap: sql<number>`SUM(CASE WHEN last_post_at IS NULL OR last_post_at < ${threeDaysAgo} THEN 1 ELSE 0 END)`,
      totalSubs: sql<number>`SUM(COALESCE(subscriber_count, 0))`,
    }).from(youtubeChannels),

    // Blueprint stats
    db.select({
      total: count(),
      active: sql<number>`SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)`,
    }).from(channelBlueprints),
  ]);

  const ps = projectStats[0];
  const cs = channelStats[0];
  const bs = blueprintStats[0];

  return {
    totalProjects: Number(ps?.total ?? 0),
    activeProjects: Number(ps?.active ?? 0),
    stalledProjects: Number(ps?.stalled ?? 0),
    failedProjectsLast24h: Number(ps?.failedRecent ?? 0),
    avgQualityScore: 75, // placeholder until quality_score column exists
    completedLast7d: Number(ps?.completedRecent ?? 0),

    totalChannels: Number(cs?.total ?? 0),
    channelsWithPostingGap: Number(cs?.withGap ?? 0),
    avgCTR: 0, // requires YouTube Analytics API
    totalSubscribers: Number(cs?.totalSubs ?? 0),
    subscriberDropChannels: 0, // requires historical tracking

    totalQueuedVideos: 0, // requires content_queue table (future)
    channelsWithEmptyQueue: 0,
    avgPostingCadenceAdherence: 100,

    totalBlueprints: Number(bs?.total ?? 0),
    activeBlueprints: Number(bs?.active ?? 0),
    blueprintExecutionRate: 0, // requires tracking videos produced per blueprint

    lowCTRVideos: 0, // requires YouTube Analytics API
    abTestsRunning: 0,
    abTestsWithWinner: 0,

    collectedAt: now,
  };
}
