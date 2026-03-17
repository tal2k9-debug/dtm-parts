import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/account/alerts — Get logged-in user's stock alerts
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown> | undefined)?.id as string | undefined;

    if (!session || !userId) {
      return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
    }

    const alerts = await prisma.stockAlert.findMany({
      where: { userId, active: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, alerts });
  } catch (error) {
    console.error("Stock alerts fetch error:", error);
    return NextResponse.json({ error: "שגיאה בטעינת ההתראות" }, { status: 500 });
  }
}

// POST /api/account/alerts — Create a new stock alert
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown> | undefined)?.id as string | undefined;

    if (!session || !userId) {
      return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
    }

    const body = await request.json();
    const { carMake, carModel, carYear, position } = body;

    if (!carMake || !carModel) {
      return NextResponse.json(
        { error: "יש לבחור יצרן ודגם" },
        { status: 400 }
      );
    }

    const alert = await prisma.stockAlert.create({
      data: {
        userId,
        carMake,
        carModel,
        carYear: carYear || null,
        position: position || null,
      },
    });

    return NextResponse.json({ success: true, alert });
  } catch (error) {
    console.error("Stock alert create error:", error);
    return NextResponse.json({ error: "שגיאה ביצירת ההתראה" }, { status: 500 });
  }
}

// DELETE /api/account/alerts — Deactivate a stock alert
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown> | undefined)?.id as string | undefined;

    if (!session || !userId) {
      return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "מזהה התראה חסר" }, { status: 400 });
    }

    // Verify ownership
    const alert = await prisma.stockAlert.findUnique({
      where: { id },
    });

    if (!alert || alert.userId !== userId) {
      return NextResponse.json({ error: "התראה לא נמצאה" }, { status: 404 });
    }

    await prisma.stockAlert.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Stock alert delete error:", error);
    return NextResponse.json({ error: "שגיאה במחיקת ההתראה" }, { status: 500 });
  }
}
