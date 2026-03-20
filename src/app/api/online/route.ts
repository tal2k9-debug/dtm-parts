import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// In-memory store for active sessions (resets on cold start, which is fine for "online now")
const activeSessions = new Map<string, number>(); // sessionId -> last ping timestamp

const ONLINE_THRESHOLD = 3 * 60 * 1000; // 3 minutes

function cleanExpired() {
  const now = Date.now();
  for (const [id, timestamp] of activeSessions) {
    if (now - timestamp > ONLINE_THRESHOLD) {
      activeSessions.delete(id);
    }
  }
}

// POST — heartbeat ping
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as Record<string, unknown>)?.role as string;

    // Don't count admin
    if (role === "ADMIN") {
      return NextResponse.json({ success: true });
    }

    const { sessionId } = await request.json();
    if (sessionId) {
      activeSessions.set(sessionId, Date.now());
    }

    // Clean expired every ping
    cleanExpired();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}

// GET — get online count
export async function GET() {
  cleanExpired();
  return NextResponse.json({
    online: activeSessions.size,
  });
}
