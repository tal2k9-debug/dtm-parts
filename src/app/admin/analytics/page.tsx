"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import {
  EyeIcon,
  DocumentTextIcon,
  UsersIcon,
  HeartIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  ChartBarIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

interface Analytics {
  overview: {
    totalRequests: number;
    pendingRequests: number;
    requestsToday: number;
    requestsThisWeek: number;
    requestsThisMonth: number;
    totalCustomers: number;
    customersThisMonth: number;
    viewsToday: number;
    viewsThisWeek: number;
    viewsThisMonth: number;
  };
  requestsByStatus: {
    pending: number;
    quoted: number;
    closed: number;
    cancelled: number;
  };
  topViewed: Array<{
    bumperId: string;
    views: number;
    name: string;
    carMake: string;
    carModel: string;
  }>;
  topRequested: Array<{
    carMake: string;
    carModel: string;
    count: number;
  }>;
  topFavorited: Array<{
    bumperId: string;
    favorites: number;
    name: string;
  }>;
  recentRequests: Array<{
    id: string;
    carMake: string;
    carModel: string;
    carYear: string;
    position: string;
    status: string;
    customerName: string;
    customerPhone: string;
    createdAt: string;
  }>;
  charts: {
    dailyViews: Array<{ date: string; count: number }>;
    dailyRequests: Array<{ date: string; count: number }>;
  };
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-extrabold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}

function SimpleBar({ label, value, maxValue }: { label: string; value: number; maxValue: number }) {
  const width = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700 w-40 truncate text-right">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
        <div
          className="bg-primary h-full rounded-full flex items-center justify-end px-2 transition-all duration-500"
          style={{ width: `${Math.max(width, 8)}%` }}
        >
          <span className="text-xs font-bold text-white">{value}</span>
        </div>
      </div>
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "ממתין",
  QUOTED: "הוצעה הצעה",
  CLOSED: "נסגר",
  CANCELLED: "בוטל",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  QUOTED: "bg-blue-100 text-blue-800",
  CLOSED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">אנליטיקס</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">שגיאה בטעינת נתוני אנליטיקס</p>
      </div>
    );
  }

  const { overview, topViewed, topRequested, topFavorited, recentRequests, requestsByStatus } = data;
  const maxViews = topViewed.length > 0 ? topViewed[0].views : 1;
  const maxRequested = topRequested.length > 0 ? topRequested[0].count : 1;
  const maxFavorited = topFavorited.length > 0 ? topFavorited[0].favorites : 1;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">אנליטיקס</h1>
        <button
          onClick={() => { setLoading(true); fetch("/api/admin/analytics").then(r => r.json()).then(d => setData(d)).finally(() => setLoading(false)); }}
          className="text-sm text-primary hover:underline"
        >
          רענן נתונים
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={EyeIcon}
          label="צפיות היום"
          value={overview.viewsToday}
          sub={`השבוע: ${overview.viewsThisWeek} | החודש: ${overview.viewsThisMonth}`}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={DocumentTextIcon}
          label="בקשות מחיר היום"
          value={overview.requestsToday}
          sub={`השבוע: ${overview.requestsThisWeek} | החודש: ${overview.requestsThisMonth}`}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          icon={ClockIcon}
          label="בקשות ממתינות"
          value={overview.pendingRequests}
          sub={`סה"כ בקשות: ${overview.totalRequests}`}
          color="bg-yellow-50 text-yellow-600"
        />
        <StatCard
          icon={UsersIcon}
          label="לקוחות רשומים"
          value={overview.totalCustomers}
          sub={`חדשים החודש: ${overview.customersThisMonth}`}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Status Breakdown */}
      <Card>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5 text-primary" />
          פילוח בקשות לפי סטטוס
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(requestsByStatus).map(([status, count]) => (
            <div key={status} className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[status.toUpperCase()] || "bg-gray-100 text-gray-600"}`}>
                {STATUS_LABELS[status.toUpperCase()] || status}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Viewed Bumpers */}
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <EyeIcon className="w-5 h-5 text-blue-500" />
            טמבונים הכי נצפים (30 יום)
          </h2>
          {topViewed.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">אין נתונים עדיין</p>
          ) : (
            <div className="space-y-3">
              {topViewed.map((item, i) => (
                <SimpleBar
                  key={item.bumperId}
                  label={`${i + 1}. ${item.name}`}
                  value={item.views}
                  maxValue={maxViews}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Top Requested */}
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
            רכבים הכי מבוקשים
          </h2>
          {topRequested.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">אין נתונים עדיין</p>
          ) : (
            <div className="space-y-3">
              {topRequested.map((item, i) => (
                <SimpleBar
                  key={`${item.carMake}-${item.carModel}`}
                  label={`${i + 1}. ${item.carMake} ${item.carModel}`}
                  value={item.count}
                  maxValue={maxRequested}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Top Favorited */}
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <HeartIcon className="w-5 h-5 text-red-500" />
            טמבונים הכי במועדפים
          </h2>
          {topFavorited.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">אין נתונים עדיין</p>
          ) : (
            <div className="space-y-3">
              {topFavorited.map((item, i) => (
                <SimpleBar
                  key={item.bumperId}
                  label={`${i + 1}. ${item.name}`}
                  value={item.favorites}
                  maxValue={maxFavorited}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Recent Requests */}
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <StarIcon className="w-5 h-5 text-yellow-500" />
            בקשות אחרונות
          </h2>
          <div className="space-y-2">
            {recentRequests.map((req) => (
              <a
                key={req.id}
                href={`/admin/requests/${req.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {req.carMake} {req.carModel} {req.carYear}
                  </p>
                  <p className="text-xs text-gray-500">{req.customerName}</p>
                </div>
                <div className="text-left">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[req.status] || "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABELS[req.status] || req.status}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(req.createdAt).toLocaleDateString("he-IL")}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
