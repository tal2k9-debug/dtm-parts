import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/admin/events — List system events
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as Record<string, unknown> | undefined)?.role;
  if (!session || role !== "ADMIN") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level");
  const source = searchParams.get("source");
  const resolved = searchParams.get("resolved");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

  const where: Record<string, unknown> = {};
  if (level) where.level = level;
  if (source) where.source = source;
  if (resolved === "true") where.resolved = true;
  if (resolved === "false") where.resolved = false;

  const [events, total, unresolvedCount] = await Promise.all([
    prisma.systemEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.systemEvent.count({ where }),
    prisma.systemEvent.count({ where: { resolved: false, level: { in: ["error", "critical"] } } }),
  ]);

  return NextResponse.json({ events, total, unresolvedCount });
}

// PATCH /api/admin/events — Resolve events
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as Record<string, unknown> | undefined)?.role;
  if (!session || role !== "ADMIN") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const body = await request.json();
  const { eventId, resolveAll } = body;

  if (resolveAll) {
    await prisma.systemEvent.updateMany({
      where: { resolved: false },
      data: { resolved: true, resolvedAt: new Date() },
    });
    return NextResponse.json({ success: true, message: "כל האירועים סומנו כטופלו" });
  }

  if (eventId) {
    await prisma.systemEvent.update({
      where: { id: eventId },
      data: { resolved: true, resolvedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Missing eventId or resolveAll" }, { status: 400 });
}
