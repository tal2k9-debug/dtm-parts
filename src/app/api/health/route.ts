import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCircuitStates } from "@/lib/resilience";
import { logger } from "@/lib/logger";
import { isBlobImageValid } from "@/lib/blob";
import { notifyAdmin } from "@/lib/whatsapp";

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

  // Check blob images coverage + spot check
  let blobCheck = { ok: true, coverage: "N/A", sampleOk: true, details: "" };
  try {
    const inStock = await prisma.bumperCache.count({ where: { status: { in: ["כן", "במלאי"] } } });
    const withBlob = await prisma.bumperCache.count({
      where: { status: { in: ["כן", "במלאי"] }, blobImageUrl: { not: null } },
    });
    const coveragePct = inStock > 0 ? Math.round((withBlob / inStock) * 100) : 0;

    // Spot-check a random blob image
    const sample = await prisma.bumperCache.findFirst({
      where: { blobImageUrl: { not: null } },
      select: { blobImageUrl: true },
      skip: Math.floor(Math.random() * Math.min(withBlob, 100)),
    });
    const sampleOk = sample?.blobImageUrl ? await isBlobImageValid(sample.blobImageUrl) : false;

    blobCheck = {
      ok: coveragePct > 50 && sampleOk,
      coverage: `${withBlob}/${inStock} (${coveragePct}%)`,
      sampleOk,
      details: !sampleOk ? "תמונה לדוגמה שבורה" : coveragePct < 50 ? "כיסוי תמונות נמוך" : "",
    };
  } catch { blobCheck = { ok: false, coverage: "error", sampleOk: false, details: "שגיאה בבדיקה" }; }

  // Check WhatsApp/Twilio
  const twilioOk = !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM &&
    process.env.ADMIN_WHATSAPP_TO
  );
  const blobTokenOk = !!process.env.BLOB_READ_WRITE_TOKEN;

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
        details: JSON.stringify({ sync, circuits, blob: blobCheck }),
      },
    });
  } catch { /* non-critical */ }

  // Collect problems for alert
  const problems: string[] = [];
  if (!db.ok) problems.push(`❌ מסד נתונים: ${db.error}`);
  if (!monday.ok) problems.push(`❌ Monday API: ${monday.error}`);
  if (!sync.ok) problems.push(`⚠️ סנכרון: סנכרון אחרון לא עדכני`);
  if (!blobCheck.ok) problems.push(`⚠️ תמונות: ${blobCheck.details || blobCheck.coverage}`);
  if (!blobTokenOk) problems.push(`❌ BLOB_READ_WRITE_TOKEN חסר`);
  if (!twilioOk) problems.push(`⚠️ WhatsApp (Twilio) לא מוגדר`);
  if (errors && errors.criticalCount > 0) problems.push(`🚨 ${errors.criticalCount} שגיאות קריטיות`);

  // Alert if degraded/down — send WhatsApp
  if (status === "down") {
    await logger.critical("health", `מערכת DOWN — DB: ${db.ok}, Monday: ${monday.ok}`, {
      db: db.error,
      monday: monday.error,
    });
  } else if (status === "degraded") {
    await logger.warn("health", `מערכת degraded — sync: ${sync.ok}, Monday: ${monday.ok}`);
  }

  // Send daily health report via WhatsApp (only when called by cron)
  if (isValidCron) {
    try {
      if (problems.length > 0) {
        await notifyAdmin(
          `🔴 בדיקה יומית — ${problems.length} בעיות:\n${problems.join("\n")}\n\nhttps://dtmparts.co.il/admin`
        );
      } else {
        await notifyAdmin(
          `🟢 בדיקה יומית — הכל תקין!\n✅ מסד נתונים\n✅ Monday סנכרון\n✅ תמונות: ${blobCheck.coverage}\n✅ BLOB Token\n${twilioOk ? "✅" : "⚠️"} WhatsApp`
        );
      }
    } catch { /* WhatsApp might be the problem */ }
  }

  const responseData: Record<string, unknown> = {
    status,
    timestamp: new Date().toISOString(),
    responseMs: Date.now() - start,
    services: {
      database: { ok: db.ok, latencyMs: db.latencyMs },
      monday: { ok: monday.ok, latencyMs: monday.latencyMs },
      sync: { ok: sync.ok, lastSync: sync.lastSync, itemCount: sync.itemCount },
      blob: blobCheck,
      blobToken: blobTokenOk,
      whatsapp: twilioOk,
      circuits,
    },
    problems: problems.length > 0 ? problems : undefined,
  };

  // Include error details only for authenticated users
  if (isAuthed) {
    responseData.errors = errors;
    if (!db.ok) responseData.services = { ...responseData.services as object, dbError: db.error };
    if (!monday.ok) responseData.services = { ...responseData.services as object, mondayError: monday.error };
  }

  return NextResponse.json(responseData, { status: overallOk ? 200 : 503 });
}
