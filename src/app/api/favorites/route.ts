import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/favorites — Get user's favorites
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown> | undefined)?.id as string | undefined;

    if (!userId) {
      return NextResponse.json(
        { error: "יש להתחבר כדי לצפות במועדפים" },
        { status: 401 }
      );
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      favorites: favorites.map((f) => f.bumperId),
    });
  } catch (error) {
    console.error("Favorites fetch error:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת המועדפים" },
      { status: 500 }
    );
  }
}

// POST /api/favorites — Add a favorite
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown> | undefined)?.id as string | undefined;

    if (!userId) {
      return NextResponse.json(
        { error: "יש להתחבר כדי להוסיף למועדפים" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bumperId } = body;

    if (!bumperId) {
      return NextResponse.json(
        { error: "חסר מזהה מוצר" },
        { status: 400 }
      );
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId,
        bumperId,
      },
    });

    return NextResponse.json({ success: true, favorite });
  } catch (error: unknown) {
    // Handle unique constraint violation (already favorited)
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      return NextResponse.json(
        { error: "המוצר כבר נמצא במועדפים" },
        { status: 409 }
      );
    }
    console.error("Favorite add error:", error);
    return NextResponse.json(
      { error: "שגיאה בהוספה למועדפים" },
      { status: 500 }
    );
  }
}

// DELETE /api/favorites — Remove a favorite
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown> | undefined)?.id as string | undefined;

    if (!userId) {
      return NextResponse.json(
        { error: "יש להתחבר כדי להסיר ממועדפים" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bumperId } = body;

    if (!bumperId) {
      return NextResponse.json(
        { error: "חסר מזהה מוצר" },
        { status: 400 }
      );
    }

    await prisma.favorite.delete({
      where: {
        userId_bumperId: {
          userId,
          bumperId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json(
        { error: "המוצר לא נמצא במועדפים" },
        { status: 404 }
      );
    }
    console.error("Favorite remove error:", error);
    return NextResponse.json(
      { error: "שגיאה בהסרה מהמועדפים" },
      { status: 500 }
    );
  }
}
