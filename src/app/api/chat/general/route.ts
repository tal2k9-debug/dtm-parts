import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";
import { notifyAdmin, formatNewMessageNotification } from "@/lib/whatsapp";

// GET /api/chat/general — Get free conversation messages for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>)?.id as string;
    const role = (session.user as Record<string, unknown>)?.role as string;

    // Admin sees all general messages; customer sees only their own
    const where = role === "ADMIN"
      ? { requestId: null }
      : { requestId: null, userId };

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: 200,
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("General chat fetch error:", error);
    return NextResponse.json({ error: "שגיאה בטעינת ההודעות" }, { status: 500 });
  }
}

// POST /api/chat/general — Send a free conversation message
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>)?.id as string;
    const userName = (session.user as Record<string, unknown>)?.name as string;
    const role = (session.user as Record<string, unknown>)?.role as string;
    const senderRole = role === "ADMIN" ? "admin" : "customer";

    const body = await request.json();
    const { content, imageUrl } = body;

    if (!content && !imageUrl) {
      return NextResponse.json({ error: "תוכן ההודעה ריק" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        requestId: null,
        userId,
        senderRole,
        content: content || null,
        imageUrl: imageUrl || null,
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    // Real-time push
    await pusher.trigger(`chat-general-${userId}`, "new-message", message);

    // Notify admin on customer message
    if (senderRole === "customer") {
      try {
        await notifyAdmin(
          formatNewMessageNotification({
            customerName: userName || "לקוח",
            preview: content ? content.substring(0, 80) : "📷 תמונה",
            requestId: `general/${userId}`,
          })
        );
      } catch { /* non-blocking */ }
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("General chat send error:", error);
    return NextResponse.json({ error: "שגיאה בשליחת ההודעה" }, { status: 500 });
  }
}
