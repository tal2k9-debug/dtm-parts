import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/account/requests — Get logged-in user's requests
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown> | undefined)?.id as string | undefined;

    if (!session || !userId) {
      return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
    }

    const requests = await prisma.quoteRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        carMake: true,
        carModel: true,
        carYear: true,
        position: true,
        status: true,
        notes: true,
        quotedPrice: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error("Account requests error:", error);
    return NextResponse.json({ error: "שגיאה בטעינת הבקשות" }, { status: 500 });
  }
}
