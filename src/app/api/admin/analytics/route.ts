import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { EXCLUDED_USER_IDS } from "@/lib/excludedUsers";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as Record<string, unknown>)?.role as string;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get admin user IDs to exclude from analytics
    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    const adminIds = [...adminUsers.map((u) => u.id), ...EXCLUDED_USER_IDS];

    // Run all queries in parallel
    const [
      // Quote request stats
      totalRequests,
      pendingRequests,
      requestsThisMonth,
      requestsThisWeek,
      requestsToday,

      // Customer stats
      totalCustomers,
      customersThisMonth,

      // Bumper view stats (excluding admin)
      viewsToday,
      viewsThisWeek,
      viewsThisMonth,

      // Page view stats (excluding admin)
      pageViewsToday,
      pageViewsThisWeek,
      pageViewsThisMonth,
      totalPageViews,

      // Unique visitors today
      uniqueVisitorsToday,

      // App vs Browser
      appViewsToday,
      browserViewsToday,

      // Top viewed bumpers (last 30 days)
      topViewedRaw,

      // Top requested bumpers (by quote requests)
      topRequestedRaw,

      // Top favorited bumpers
      topFavoritedRaw,

      // Recent quote requests
      recentRequests,

      // Requests by status
      requestsByStatus,

      // Daily views for chart (last 14 days)
      dailyViewsRaw,

      // Daily requests for chart (last 14 days)
      dailyRequestsRaw,
    ] = await Promise.all([
      prisma.quoteRequest.count(),
      prisma.quoteRequest.count({ where: { status: "PENDING" } }),
      prisma.quoteRequest.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.quoteRequest.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.quoteRequest.count({ where: { createdAt: { gte: todayStart } } }),

      prisma.user.count({ where: { role: { not: "ADMIN" } } }),
      prisma.user.count({ where: { role: { not: "ADMIN" }, createdAt: { gte: monthAgo } } }),

      prisma.bumperView.count({ where: { createdAt: { gte: todayStart }, OR: [{ userId: null }, { userId: { notIn: adminIds } }] } }),
      prisma.bumperView.count({ where: { createdAt: { gte: weekAgo }, OR: [{ userId: null }, { userId: { notIn: adminIds } }] } }),
      prisma.bumperView.count({ where: { createdAt: { gte: monthAgo }, OR: [{ userId: null }, { userId: { notIn: adminIds } }] } }),

      // Page views (excluding admin)
      prisma.pageView.count({ where: { createdAt: { gte: todayStart }, OR: [{ userId: null }, { userId: { notIn: adminIds } }] } }),
      prisma.pageView.count({ where: { createdAt: { gte: weekAgo }, OR: [{ userId: null }, { userId: { notIn: adminIds } }] } }),
      prisma.pageView.count({ where: { createdAt: { gte: monthAgo }, OR: [{ userId: null }, { userId: { notIn: adminIds } }] } }),
      prisma.pageView.count({ where: { OR: [{ userId: null }, { userId: { notIn: adminIds } }] } }),

      // Unique visitors today (by sessionId)
      prisma.pageView.groupBy({
        by: ["sessionId"],
        where: { createdAt: { gte: todayStart }, sessionId: { not: null } },
      }).then((r) => r.length),

      // App vs Browser page views today
      prisma.pageView.count({ where: { createdAt: { gte: todayStart }, source: "app", OR: [{ userId: null }, { userId: { notIn: adminIds } }] } }),
      prisma.pageView.count({ where: { createdAt: { gte: todayStart }, source: "browser", OR: [{ userId: null }, { userId: { notIn: adminIds } }] } }),

      prisma.bumperView.groupBy({
        by: ["bumperId"],
        _count: { bumperId: true },
        where: { createdAt: { gte: monthAgo } },
        orderBy: { _count: { bumperId: "desc" } },
        take: 10,
      }),

      prisma.quoteRequest.groupBy({
        by: ["carMake", "carModel"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),

      prisma.favorite.groupBy({
        by: ["bumperId"],
        _count: { bumperId: true },
        orderBy: { _count: { bumperId: "desc" } },
        take: 10,
      }),

      prisma.quoteRequest.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, phone: true } } },
      }),

      prisma.quoteRequest.groupBy({
        by: ["status"],
        _count: { id: true },
      }),

      prisma.$queryRaw`
        SELECT DATE(\"createdAt\") as date, COUNT(*)::int as count
        FROM "BumperView"
        WHERE "createdAt" >= ${weekAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      ` as Promise<Array<{ date: Date; count: number }>>,

      prisma.$queryRaw`
        SELECT DATE(\"createdAt\") as date, COUNT(*)::int as count
        FROM "QuoteRequest"
        WHERE "createdAt" >= ${weekAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      ` as Promise<Array<{ date: Date; count: number }>>,
    ]);

    // Enrich top viewed bumpers with names from BumperCache
    const topViewedIds = topViewedRaw.map((v) => v.bumperId);
    const bumperNames = topViewedIds.length > 0
      ? await prisma.bumperCache.findMany({
          where: { OR: [{ mondayItemId: { in: topViewedIds } }, { id: { in: topViewedIds } }] },
          select: { id: true, mondayItemId: true, name: true, carMake: true, carModel: true, carYear: true },
        })
      : [];
    const bumperNameMap: Record<string, typeof bumperNames[0]> = {};
    for (const b of bumperNames) {
      bumperNameMap[b.mondayItemId] = b;
      bumperNameMap[b.id] = b;
    }

    const topViewed = topViewedRaw.map((v) => ({
      bumperId: v.bumperId,
      views: v._count.bumperId,
      name: bumperNameMap[v.bumperId]?.name || v.bumperId,
      carMake: bumperNameMap[v.bumperId]?.carMake || "",
      carModel: bumperNameMap[v.bumperId]?.carModel || "",
      carYear: bumperNameMap[v.bumperId]?.carYear || "",
    }));

    // Top viewed TODAY
    const topViewedTodayRaw = await prisma.bumperView.groupBy({
      by: ["bumperId"],
      _count: { bumperId: true },
      where: { createdAt: { gte: todayStart } },
      orderBy: { _count: { bumperId: "desc" } },
      take: 5,
    });
    const todayIds = topViewedTodayRaw.map((v) => v.bumperId);
    const todayBumpers = todayIds.length > 0
      ? await prisma.bumperCache.findMany({
          where: { OR: [{ mondayItemId: { in: todayIds } }, { id: { in: todayIds } }] },
          select: { id: true, mondayItemId: true, name: true, carMake: true, carModel: true, carYear: true },
        })
      : [];
    const todayMap: Record<string, typeof todayBumpers[0]> = {};
    for (const b of todayBumpers) {
      todayMap[b.mondayItemId] = b;
      todayMap[b.id] = b;
    }
    const topViewedToday = topViewedTodayRaw.map((v) => ({
      bumperId: v.bumperId,
      views: v._count.bumperId,
      name: todayMap[v.bumperId]?.name || v.bumperId,
      carMake: todayMap[v.bumperId]?.carMake || "",
      carModel: todayMap[v.bumperId]?.carModel || "",
      carYear: todayMap[v.bumperId]?.carYear || "",
    }));

    // Enrich top favorited
    const topFavIds = topFavoritedRaw.map((f) => f.bumperId);
    const favBumperNames = topFavIds.length > 0
      ? await prisma.bumperCache.findMany({
          where: { OR: [{ mondayItemId: { in: topFavIds } }, { id: { in: topFavIds } }] },
          select: { id: true, mondayItemId: true, name: true, carMake: true, carModel: true, carYear: true },
        })
      : [];
    const favNameMap: Record<string, typeof favBumperNames[0]> = {};
    for (const b of favBumperNames) {
      favNameMap[b.mondayItemId] = b;
      favNameMap[b.id] = b;
    }

    const topFavorited = topFavoritedRaw.map((f) => ({
      bumperId: f.bumperId,
      favorites: f._count.bumperId,
      name: favNameMap[f.bumperId]?.name || f.bumperId,
      carMake: favNameMap[f.bumperId]?.carMake || "",
      carModel: favNameMap[f.bumperId]?.carModel || "",
      carYear: favNameMap[f.bumperId]?.carYear || "",
    }));

    const topRequested = topRequestedRaw.map((r) => ({
      carMake: r.carMake,
      carModel: r.carModel,
      count: r._count.id,
    }));

    const statusMap = Object.fromEntries(
      requestsByStatus.map((s) => [s.status, s._count.id])
    );

    // Fetch online count
    let onlineCount = 0;
    try {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
      const onlineRes = await fetch(`${baseUrl}/api/online`);
      const onlineData = await onlineRes.json();
      onlineCount = onlineData.online || 0;
    } catch { /* ignore */ }

    return NextResponse.json({
      overview: {
        totalRequests,
        pendingRequests,
        requestsToday,
        requestsThisWeek,
        requestsThisMonth,
        totalCustomers,
        customersThisMonth,
        viewsToday,
        viewsThisWeek,
        viewsThisMonth,
        pageViewsToday,
        pageViewsThisWeek,
        pageViewsThisMonth,
        totalPageViews,
        uniqueVisitorsToday,
        appViewsToday,
        browserViewsToday,
        onlineNow: onlineCount,
      },
      requestsByStatus: {
        pending: statusMap["PENDING"] || 0,
        quoted: statusMap["QUOTED"] || 0,
        closed: statusMap["CLOSED"] || 0,
        cancelled: statusMap["CANCELLED"] || 0,
      },
      topViewed,
      topViewedToday,
      topRequested,
      topFavorited,
      recentRequests: recentRequests.map((r) => ({
        id: r.id,
        carMake: r.carMake,
        carModel: r.carModel,
        carYear: r.carYear,
        position: r.position,
        status: r.status,
        customerName: r.user?.name || r.guestName || "אנונימי",
        customerPhone: r.user?.phone || r.guestPhone || "",
        createdAt: r.createdAt,
      })),
      charts: {
        dailyViews: dailyViewsRaw,
        dailyRequests: dailyRequestsRaw,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "שגיאה בטעינת נתונים" }, { status: 500 });
  }
}
