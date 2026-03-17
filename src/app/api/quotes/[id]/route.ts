import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Status } from "@prisma/client";

// GET /api/quotes/[id] — Fetch single quote with messages and user
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown> | undefined)?.id as string | undefined;
    const role = (session?.user as Record<string, unknown> | undefined)?.role as string | undefined;

    const quote = await prisma.quoteRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            businessName: true,
            role: true,
          },
        },
        messages: {
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
        },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: "הבקשה לא נמצאה" },
        { status: 404 }
      );
    }

    // Authorization: admin can see all, customers can only see their own
    if (role !== "ADMIN" && quote.userId !== userId) {
      return NextResponse.json(
        { error: "אין הרשאה" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      request: quote,
    });
  } catch (error) {
    console.error("Quote fetch error:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת הבקשה" },
      { status: 500 }
    );
  }
}

// PATCH /api/quotes/[id] — Update quote (admin only: status, quotedPrice)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check admin auth
    const session = await getServerSession(authOptions);
    const role = (session?.user as Record<string, unknown> | undefined)?.role;

    if (!session || role !== "ADMIN") {
      return NextResponse.json(
        { error: "אין הרשאה" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, quotedPrice } = body;

    // Validate that the quote exists
    const existing = await prisma.quoteRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "הבקשה לא נמצאה" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (status !== undefined) {
      if (!Object.values(Status).includes(status as Status)) {
        return NextResponse.json(
          { error: "סטטוס לא חוקי" },
          { status: 400 }
        );
      }
      updateData.status = status;

      // Set closedAt when closing
      if (status === Status.CLOSED || status === Status.CANCELLED) {
        updateData.closedAt = new Date();
      }
    }

    if (quotedPrice !== undefined) {
      if (typeof quotedPrice !== "number" || quotedPrice < 0) {
        return NextResponse.json(
          { error: "מחיר לא חוקי" },
          { status: 400 }
        );
      }
      updateData.quotedPrice = quotedPrice;

      // Auto-set status to QUOTED if providing a price and still PENDING
      if (!status && existing.status === "PENDING") {
        updateData.status = Status.QUOTED;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "לא נשלחו שדות לעדכון" },
        { status: 400 }
      );
    }

    const updated = await prisma.quoteRequest.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            businessName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      request: updated,
    });
  } catch (error) {
    console.error("Quote update error:", error);
    return NextResponse.json(
      { error: "שגיאה בעדכון הבקשה" },
      { status: 500 }
    );
  }
}
