import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/account/requests/[id] — Get a single request detail (only if owned by user)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown> | undefined)?.id as string | undefined;

    if (!session || !userId) {
      return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
    }

    const { id } = await params;

    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id },
      include: {
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

    if (!quoteRequest) {
      return NextResponse.json({ error: "הבקשה לא נמצאה" }, { status: 404 });
    }

    if (quoteRequest.userId !== userId) {
      return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
    }

    return NextResponse.json({ success: true, request: quoteRequest });
  } catch (error) {
    console.error("Account request detail error:", error);
    return NextResponse.json({ error: "שגיאה בטעינת הבקשה" }, { status: 500 });
  }
}

// DELETE /api/account/requests/[id] — Cancel a request (set status to CANCELLED, only if PENDING)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown> | undefined)?.id as string | undefined;

    if (!session || !userId) {
      return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
    }

    const { id } = await params;

    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id },
    });

    if (!quoteRequest) {
      return NextResponse.json({ error: "הבקשה לא נמצאה" }, { status: 404 });
    }

    if (quoteRequest.userId !== userId) {
      return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
    }

    if (quoteRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "ניתן לבטל רק בקשות בסטטוס ממתין לטיפול" },
        { status: 400 }
      );
    }

    const updated = await prisma.quoteRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    console.error("Account request cancel error:", error);
    return NextResponse.json({ error: "שגיאה בביטול הבקשה" }, { status: 500 });
  }
}
