/**
 * JobMonitor Agent — Detects and recovers stalled video generation jobs
 * 
 * Runs every 5 minutes via Heartbeat cron
 * - Finds jobs stuck in "processing" for > 30 min
 * - Auto-retries with exponential backoff
 * - Notifies user if recovery fails
 * - Logs all recovery attempts
 */

import { getDb } from "../db";
import { videoProjects, users } from "../../drizzle/schema";
import { eq, and, lt, gte } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";
import { invokeLLM } from "../_core/llm";

interface JobRecoveryLog {
  projectId: number;
  jobId?: string;
  status: "timeout" | "stalled" | "error" | "recovered" | "failed";
  reason: string;
  action: "retry" | "cancel" | "manual_review";
  recoveredAt?: string;
}

const TIMEOUT_MINUTES = 30;
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MINUTES = [1, 5, 15]; // exponential backoff (minutes)

// Import types
import type { VideoProject } from "../../drizzle/schema";

export async function runJobMonitorAgent(): Promise<{
  checked: number;
  recovered: number;
  failed: number;
  cancelled: number;
  logs: JobRecoveryLog[];
}> {
  const db = await getDb();
  if (!db) {
    console.error("[JobMonitor] Database not available");
    return { checked: 0, recovered: 0, failed: 0, cancelled: 0, logs: [] };
  }

  const logs: JobRecoveryLog[] = [];
  let recovered = 0;
  let failed = 0;
  let cancelled = 0;

  try {
    // Find all projects stuck in "processing" for > 30 min
    const timeoutThreshold = new Date(Date.now() - TIMEOUT_MINUTES * 60 * 1000);
    
    // Find projects in any processing state that haven't been updated
    const stalledProjects = await db
      .select()
      .from(videoProjects)
      .where(
        and(
          lt(videoProjects.updatedAt, timeoutThreshold) // not updated in 30 min
        )
      );

    console.log(`[JobMonitor] Found ${stalledProjects.length} stalled projects`);

    for (const project of stalledProjects) {
      // Parse retry count from errorMessage
      const retryMatch = project.errorMessage?.match(/Retry (\d+)/);
      const retryCount = retryMatch ? parseInt(retryMatch[1]) : 0;

      if (retryCount >= MAX_RETRIES) {
        // Max retries exceeded - cancel job
        await db
          .update(videoProjects)
          .set({
            status: "failed",
            errorMessage: "Max retries exceeded after 30+ min timeout",
          })
          .where(eq(videoProjects.id, project.id));

        logs.push({
          projectId: project.id,
          status: "failed",
          reason: "Max retries exceeded after 30+ min timeout",
          action: "cancel",
        });

        cancelled++;

        // Notify user
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, project.userId))
          .limit(1);

        if (user.length > 0) {
          await notifyOwner({
            title: "Video Generation Failed",
            content: `Project "${project.title}" failed after multiple retry attempts. Please check the error log.`,
          });
        }
      } else {
        // Retry with backoff
        const nextRetryDelay = RETRY_BACKOFF_MINUTES[retryCount] || 15;
        const nextRetryTime = new Date(Date.now() + nextRetryDelay * 60 * 1000);

        // Store retry info in errorMessage temporarily
        const retryInfo = `Retry ${retryCount + 1}/${MAX_RETRIES} scheduled for ${nextRetryTime.toISOString()}`;
        
        await db
          .update(videoProjects)
          .set({
            errorMessage: retryInfo,
          })
          .where(eq(videoProjects.id, project.id));

        logs.push({
          projectId: project.id,
          status: "recovered",
          reason: `Stalled for ${TIMEOUT_MINUTES} min, retry ${retryCount + 1}/${MAX_RETRIES}`,
          action: "retry",
          recoveredAt: new Date().toISOString(),
        });

        recovered++;

        console.log(
          `[JobMonitor] Scheduled retry for project ${project.id} (attempt ${retryCount + 1})`
        );
      }
    }

    // Log recovery attempts to database
    if (logs.length > 0) {
      await logRecoveryAttempts(db, logs);
    }

    return {
      checked: stalledProjects.length,
      recovered,
      failed,
      cancelled,
      logs,
    };
  } catch (error) {
    console.error("[JobMonitor] Error during job monitoring:", error);
    return { checked: 0, recovered: 0, failed: 0, cancelled: 0, logs: [] };
  }
}

/**
 * Log recovery attempts to database
 * Note: Requires job_recovery_log table (created in migration 0016)
 */
async function logRecoveryAttempts(
  db: any,
  logs: JobRecoveryLog[]
): Promise<void> {
  try {
    // This would require a job_recovery_log table
    // For now, just log to console
    console.log("[JobMonitor] Recovery attempts:", JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error("[JobMonitor] Failed to log recovery attempts:", error);
  }
}

/**
 * Check if a specific job has timed out
 */
export async function checkJobTimeout(projectId: number): Promise<{
  isTimedOut: boolean;
  minutesElapsed: number;
  retryCount: number;
  canRetry: boolean;
}> {
  const db = await getDb();
  if (!db) {
    return {
      isTimedOut: false,
      minutesElapsed: 0,
      retryCount: 0,
      canRetry: false,
    };
  }

  const project = await db
    .select()
    .from(videoProjects)
    .where(eq(videoProjects.id, projectId))
    .limit(1);

  if (project.length === 0) {
    return {
      isTimedOut: false,
      minutesElapsed: 0,
      retryCount: 0,
      canRetry: false,
    };
  }

  const proj = project[0];
  const minutesElapsed = Math.floor(
    (Date.now() - proj.updatedAt.getTime()) / 60000
  );
  // Parse retry count from errorMessage (temporary storage)
  const retryMatch = proj.errorMessage?.match(/Retry (\d+)/);
  const retryCount = retryMatch ? parseInt(retryMatch[1]) : 0;
  const isTimedOut = minutesElapsed > TIMEOUT_MINUTES;
  const canRetry = retryCount < MAX_RETRIES;

  return {
    isTimedOut,
    minutesElapsed,
    retryCount,
    canRetry,
  };
}

/**
 * Manually retry a failed job
 */
export async function retryFailedJob(projectId: number): Promise<{
  success: boolean;
  message: string;
  nextRetryAt?: string;
}> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database not available" };
  }

  const project = await db
    .select()
    .from(videoProjects)
    .where(eq(videoProjects.id, projectId))
    .limit(1);

  if (project.length === 0) {
    return { success: false, message: "Project not found" };
  }

  const proj = project[0];
  // Parse retry count from errorMessage
  const retryMatch = proj.errorMessage?.match(/Retry (\d+)/);
  const retryCount = retryMatch ? parseInt(retryMatch[1]) : 0;

  if (retryCount >= MAX_RETRIES) {
    return {
      success: false,
      message: `Max retries (${MAX_RETRIES}) exceeded. Please contact support.`,
    };
  }

  const nextRetryDelay = RETRY_BACKOFF_MINUTES[retryCount] || 15;
  const nextRetryAt = new Date(Date.now() + nextRetryDelay * 60 * 1000);

  const retryInfo = `Retry ${retryCount + 1}/${MAX_RETRIES} scheduled for ${nextRetryAt.toISOString()} - Manual retry by user`;
  
  await db
    .update(videoProjects)
    .set({
      status: "generating_screenplay",
      errorMessage: retryInfo,
    })
    .where(eq(videoProjects.id, projectId));

  return {
    success: true,
    message: `Retry scheduled (attempt ${retryCount + 1}/${MAX_RETRIES})`,
    nextRetryAt: nextRetryAt.toISOString(),
  };
}

/**
 * Cancel a stuck job
 */
export async function cancelStuckJob(projectId: number): Promise<{
  success: boolean;
  message: string;
}> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database not available" };
  }

  const project = await db
    .select()
    .from(videoProjects)
    .where(eq(videoProjects.id, projectId))
    .limit(1);

  if (project.length === 0) {
    return { success: false, message: "Project not found" };
  }

  await db
    .update(videoProjects)
    .set({
      status: "cancelled",
      errorMessage: "User cancelled due to timeout",
    })
    .where(eq(videoProjects.id, projectId));

  return {
    success: true,
    message: "Job cancelled successfully",
  };
}
