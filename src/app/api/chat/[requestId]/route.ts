import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";
import { notifyAdmin, formatNewMessageNotification } from "@/lib/whatsapp";

// GET /api/chat/[requestId] — Get messages for a request
export async function GET(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;

    // Verify the request exists
    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id: requestId },
    });

    if (!quoteRequest) {
      return NextResponse.json(
        { error: "בקשה לא נמצאה" },
        { status: 404 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { requestId },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      requestId,
      messages,
    });
  } catch (error) {
    console.error("Chat fetch error:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת ההודעות" },
      { status: 500 }
    );
  }
}

// POST /api/chat/[requestId] — Send a new message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const body = await request.json();
    const { content, senderRole, userId, imageUrl } = body;

    if (!content && !imageUrl) {
      return NextResponse.json(
        { error: "תוכן ההודעה ריק" },
        { status: 400 }
      );
    }

    if (!senderRole || !["customer", "admin"].includes(senderRole)) {
      return NextResponse.json(
        { error: "תפקיד שולח לא תקין" },
        { status: 400 }
      );
    }

    // Verify the request exists
    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: { name: true, phone: true },
        },
      },
    });

    if (!quoteRequest) {
      return NextResponse.json(
        { error: "בקשה לא נמצאה" },
        { status: 404 }
      );
    }

    // Save message to DB
    const message = await prisma.message.create({
      data: {
        requestId,
        userId: userId || null,
        senderRole,
        content: content || null,
        imageUrl: imageUrl || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Trigger Pusher event for real-time update
    await pusher.trigger(`chat-${requestId}`, "new-message", message);

    // If customer message, notify admin via WhatsApp
    if (senderRole === "customer") {
      try {
        const customerName =
          quoteRequest.user?.name || quoteRequest.guestName || "לקוח";
        const preview = content
          ? content.substring(0, 80)
          : "📷 תמונה";

        await notifyAdmin(
          formatNewMessageNotification({
            customerName,
            preview,
            requestId,
          })
        );
      } catch (whatsappError) {
        console.error("WhatsApp notification failed:", whatsappError);
        // Don't fail the request if WhatsApp fails
      }
    }

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Chat send error:", error);
    return NextResponse.json(
      { error: "שגיאה בשליחת ההודעה" },
      { status: 500 }
    );
  }
}
