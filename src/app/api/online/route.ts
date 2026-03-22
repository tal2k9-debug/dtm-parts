import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isExcludedUser } from "@/lib/excludedUsers";

interface ActiveSession {
  timestamp: number;
  userName: string | null;
  userPhone: string | null;
  userId: string | null;
  currentPage: string | null;
  currentBumperId: string | null;
  currentBumperName: string | null;
}

// In-memory store for active sessions
const activeSessions = new Map<string, ActiveSession>();

const ONLINE_THRESHOLD = 3 * 60 * 1000; // 3 minutes

function cleanExpired() {
  const now = Date.now();
  for (const [id, session] of activeSessions) {
    if (now - session.timestamp > ONLINE_THRESHOLD) {
      activeSessions.delete(id);
    }
  }
}

// POST — heartbeat ping
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as Record<string, unknown> | undefined;
    const role = user?.role as string | undefined;

    // Don't count admin or excluded users
    const userId = user?.id as string | undefined;
    if (isExcludedUser(userId, role)) {
      return NextResponse.json({ success: true });
    }

    const { sessionId, page, bumperId, bumperName } = await request.json();
    if (sessionId) {
      activeSessions.set(sessionId, {
        timestamp: Date.now(),
        userName: (user?.name as string) || null,
        userPhone: (user?.phone as string) || null,
        userId: (user?.id as string) || null,
        currentPage: page || null,
        currentBumperId: bumperId || null,
        currentBumperName: bumperName || null,
      });
    }

    cleanExpired();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}

// GET — get online info
export async function GET(request: Request) {
  cleanExpired();

  const { searchParams } = new URL(request.url);
  const detail = searchParams.get("detail");
  const bumper = searchParams.get("bumper");

  // Public: count viewers on a specific bumper
  if (bumper) {
    let viewers = 0;
    for (const s of activeSessions.values()) {
      if (s.currentBumperId === bumper) viewers++;
    }
    return NextResponse.json({ viewers });
  }

  // Admin detail view
  if (detail === "admin") {
    const session = await getServerSession(authOptions);
    const role = (session?.user as Record<string, unknown>)?.role as string;
    if (role !== "ADMIN") {
      return NextResponse.json({ online: activeSessions.size });
    }

    const sessions = Array.from(activeSessions.entries()).map(([id, s]) => ({
      sessionId: id.substring(0, 8) + "...",
      userName: s.userName || "אורח",
      userPhone: s.userPhone || null,
      isRegistered: !!s.userId,
      currentPage: s.currentPage,
      currentBumperId: s.currentBumperId,
      currentBumperName: s.currentBumperName,
      lastSeen: new Date(s.timestamp).toISOString(),
    }));

    return NextResponse.json({
      online: activeSessions.size,
      sessions,
    });
  }

  // Public: just count
  return NextResponse.json({
    online: activeSessions.size,
  });
}
