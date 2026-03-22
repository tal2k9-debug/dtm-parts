import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// POST /api/tracking — Track a bumper view or page view
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, bumperId, path, sessionId, referrer, source } = body;

    const session = await getServerSession(authOptions);
    const user = session?.user as Record<string, unknown> | undefined;
    const userId = user?.id as string | undefined;
    const role = user?.role as string | undefined;

    // Don't track admin visits
    if (role === "ADMIN") {
      return NextResponse.json({ success: true });
    }

    if (type === "bumper_view" && bumperId) {
      await prisma.bumperView.create({
        data: {
          bumperId,
          userId: userId || null,
          sessionId: sessionId || null,
          source: source || null,
        },
      });
    } else if (type === "page_view" && path) {
      await prisma.pageView.create({
        data: {
          path,
          userId: userId || null,
          sessionId: sessionId || null,
          referrer: referrer || null,
          source: source || null,
        },
      });
    } else {
      return NextResponse.json({ error: "Invalid tracking type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tracking error:", error);
    // Never fail the user experience for tracking
    return NextResponse.json({ success: true });
  }
}
