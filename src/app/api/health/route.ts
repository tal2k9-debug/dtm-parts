import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCircuitStates } from "@/lib/resilience";
import { logger } from "@/lib/logger";

// POST /api/health — Receive client-side error reports
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.type === "client_error") {
      await logger.error("api", `שגיאת צד לקוח: ${body.message}`, {
        url: body.url,
        stack: body.stack,
        componentStack: body.componentStack,
      });
    }
  } catch { /* ignore */ }
  return NextResponse.json({ received: true });
}

interface CheckResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return { ok: false, latencyMs: Date.now() - start, error: String(err) };
  }
}

async function checkMonday(): Promise<CheckResult> {
  const start = Date.now();
  const apiKey = process.env.MONDAY_API_KEY;
  if (!apiKey) return { ok: false, latencyMs: 0, error: "MONDAY_API_KEY not set" };

  try {
    const res = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: apiKey },
      body: JSON.stringify({ query: "{ me { id } }" }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    if (data?.data?.me?.id) {
      return { ok: true, latencyMs: Date.now() - start };
    }
    return { ok: false, latencyMs: Date.now() - start, error: "Invalid response" };
  } catch (err) {
    return { ok: false, latencyMs: Date.now() - start, error: String(err) };
  }
}

async function checkLastSync(): Promise<{ ok: boolean; lastSync: string | null; itemCount: number }> {
  try {
    const [latest, count] = await Promise.all([
      prisma.bumperCache.findFirst({ orderBy: { lastSynced: "desc" }, select: { lastSynced: true } }),
      prisma.bumperCache.count(),
    ]);

    const lastSync = latest?.lastSynced?.toISOString() || null;
    const hoursSince = latest?.lastSynced
      ? (Date.now() - latest.lastSynced.getTime()) / (1000 * 60 * 60)
      : Infinity;

    return {
      ok: hoursSince < 1, // healthy if synced within last hour
      lastSync,
      itemCount: count,
    };
  } catch {
    return { ok: false, lastSync: null, itemCount: 0 };
  }
}

async function getRecentErrors() {
  try {
    const [errorCount, criticalCount, recentErrors] = await Promise.all([
      prisma.systemEvent.count({
        where: { level: { in: ["error", "critical"] }, resolved: false, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      prisma.systemEvent.count({
        where: { level: "critical", resolved: false, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      prisma.systemEvent.findMany({
        where: { level: { in: ["error", "critical"] }, resolved: false },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);
    return { errorCount, criticalCount, recentErrors };
  } catch {
    return { errorCount: -1, criticalCount: -1, recentErrors: [] };
  }
}

export async function GET(request: Request) {
  const start = Date.now();

  // Auth check: cron secret or admin session
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isValidCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isDev = !cronSecret;

  let isAuthed = isDev || isValidCron;
  if (!isAuthed) {
    try {
      const { getServerSession } = await import("next-auth");
      const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
      const session = await getServerSession(authOptions);
      const role = (session?.user as Record<string, unknown> | undefined)?.role;
      isAuthed = session && role === "ADMIN" ? true : false;
    } catch {
      isAuthed = false;
    }
  }

  // Run checks in parallel
  const [db, monday, sync, errors] = await Promise.all([
    checkDatabase(),
    checkMonday(),
    checkLastSync(),
    isAuthed ? getRecentErrors() : Promise.resolve(null),
  ]);

  const circuits = getCircuitStates();

  const overallOk = db.ok && monday.ok;
  const status = !db.ok ? "down" : !monday.ok || !sync.ok ? "degraded" : "healthy";

  // Persist health check
  try {
    await prisma.healthCheck.create({
      data: {
        status,
        dbOk: db.ok,
        mondayOk: monday.ok,
        pusherOk: true, // passive check
        responseMs: Date.now() - start,
        details: JSON.stringify({ sync, circuits }),
      },
    });
  } catch { /* non-critical */ }

  // Alert if degraded/down
  if (status === "down") {
    await logger.critical("health", `מערכת DOWN — DB: ${db.ok}, Monday: ${monday.ok}`, {
      db: db.error,
      monday: monday.error,
    });
  } else if (status === "degraded") {
    await logger.warn("health", `מערכת degraded — sync: ${sync.ok}, Monday: ${monday.ok}`);
  }

  const responseData: Record<string, unknown> = {
    status,
    timestamp: new Date().toISOString(),
    responseMs: Date.now() - start,
    services: {
      database: { ok: db.ok, latencyMs: db.latencyMs },
      monday: { ok: monday.ok, latencyMs: monday.latencyMs },
      sync: { ok: sync.ok, lastSync: sync.lastSync, itemCount: sync.itemCount },
      circuits,
    },
  };

  // Include error details only for authenticated users
  if (isAuthed) {
    responseData.errors = errors;
    if (!db.ok) responseData.services = { ...responseData.services as object, dbError: db.error };
    if (!monday.ok) responseData.services = { ...responseData.services as object, mondayError: monday.error };
  }

  return NextResponse.json(responseData, { status: overallOk ? 200 : 503 });
}
