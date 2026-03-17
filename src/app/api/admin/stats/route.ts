import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/admin/stats — Dashboard KPIs + recent activity
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as Record<string, unknown> | undefined)?.role;

    if (!session || role !== "ADMIN") {
      return NextResponse.json(
        { error: "אין הרשאה" },
        { status: 403 }
      );
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      pendingRequests,
      monthlyRequests,
      newCustomersThisMonth,
      revenueResult,
      recentRequests,
    ] = await Promise.all([
      // Count PENDING requests
      prisma.quoteRequest.count({
        where: { status: "PENDING" },
      }),

      // Count requests this month
      prisma.quoteRequest.count({
        where: {
          createdAt: { gte: startOfMonth },
        },
      }),

      // Count new customers this month (non-admin users)
      prisma.user.count({
        where: {
          role: { not: "ADMIN" },
          createdAt: { gte: startOfMonth },
        },
      }),

      // Sum revenue from closed requests
      prisma.quoteRequest.aggregate({
        _sum: { quotedPrice: true },
        where: {
          status: "CLOSED",
          closedAt: { gte: startOfMonth },
        },
      }),

      // Last 10 requests for activity feed
      prisma.quoteRequest.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      }),
    ]);

    const monthlyRevenue = revenueResult._sum.quotedPrice || 0;

    return NextResponse.json({
      success: true,
      stats: {
        pendingRequests,
        monthlyRequests,
        newCustomersThisMonth,
        monthlyRevenue,
      },
      recentRequests,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת הנתונים" },
      { status: 500 }
    );
  }
}
