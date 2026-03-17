import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { notifyAdmin, formatNewRequestMessage } from "@/lib/whatsapp";
import { Position, Status } from "@prisma/client";

// POST /api/quotes — Create new quote request
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { carMake, carModel, carYear, position, notes, name, phone, imageUrl } = body;

    // Validation
    if (!carMake || !carModel || !carYear || !position) {
      return NextResponse.json(
        { error: "חסרים פרטי רכב" },
        { status: 400 }
      );
    }

    // Validate position enum
    if (!["FRONT", "REAR"].includes(position)) {
      return NextResponse.json(
        { error: "עמדה לא חוקית — קדמי או אחורי בלבד" },
        { status: 400 }
      );
    }

    // Check if user is logged in
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown> | undefined)?.id as string | undefined;

    // If not logged in, require name and phone
    if (!userId && (!name || !phone)) {
      return NextResponse.json(
        { error: "נא למלא שם וטלפון" },
        { status: 400 }
      );
    }

    // Save to database
    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        userId: userId || null,
        guestName: userId ? null : name,
        guestPhone: userId ? null : phone,
        carMake,
        carModel,
        carYear,
        position: position as Position,
        notes: notes || null,
        imageUrl: imageUrl || null,
        status: Status.PENDING,
      },
      include: {
        user: userId ? { select: { name: true, phone: true } } : false,
      },
    });

    // Send WhatsApp notification to Tal (non-blocking)
    try {
      const customerName = userId ? quoteRequest.user?.name || name : name;
      const customerPhone = userId ? quoteRequest.user?.phone || phone : phone;

      const message = formatNewRequestMessage({
        name: customerName,
        phone: customerPhone,
        carMake,
        carModel,
        carYear,
        position,
        notes,
        requestId: quoteRequest.id,
      });

      await notifyAdmin(message);
    } catch (whatsappError) {
      console.error("WhatsApp notification failed (non-blocking):", whatsappError);
    }

    return NextResponse.json({
      success: true,
      request: quoteRequest,
      message: "הבקשה נשלחה בהצלחה! ניצור קשר בקרוב.",
    });
  } catch (error) {
    console.error("Quote creation error:", error);
    return NextResponse.json(
      { error: "שגיאה ביצירת הבקשה" },
      { status: 500 }
    );
  }
}

// GET /api/quotes — List quotes (admin only)
export async function GET(request: Request) {
  try {
    // Check admin auth
    const session = await getServerSession(authOptions);
    const role = (session?.user as Record<string, unknown> | undefined)?.role;

    if (!session || role !== "ADMIN") {
      return NextResponse.json(
        { error: "אין הרשאה" },
        { status: 403 }
      );
    }

    // Parse query params for filtering
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (statusFilter && Object.values(Status).includes(statusFilter as Status)) {
      where.status = statusFilter as Status;
    }

    const [requests, total] = await Promise.all([
      prisma.quoteRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              businessName: true,
              role: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.quoteRequest.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      requests,
      total,
    });
  } catch (error) {
    console.error("Quotes fetch error:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת הבקשות" },
      { status: 500 }
    );
  }
}
