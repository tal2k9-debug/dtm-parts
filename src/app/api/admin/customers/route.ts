import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/admin/customers — List all customers with request counts
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as Record<string, unknown> | undefined)?.role;

    if (!session || role !== "ADMIN") {
      return NextResponse.json(
        { error: "אין הרשאה" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {
      role: { not: "ADMIN" },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { businessName: { contains: search, mode: "insensitive" } },
      ];
    }

    const customers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        businessName: true,
        businessType: true,
        businessId: true,
        role: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: { requests: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      customers,
      total: customers.length,
    });
  } catch (error) {
    console.error("Customers fetch error:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת הלקוחות" },
      { status: 500 }
    );
  }
}
