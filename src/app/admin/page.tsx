"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { formatRelativeTime, getRequestStatusLabel, getPositionLabel, formatPrice } from "@/lib/utils";
import {
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  UsersIcon,
  TruckIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

interface StatsData {
  pendingRequests: number;
  monthlyRequests: number;
  newCustomersThisMonth: number;
  monthlyRevenue: number;
}

interface RecentRequest {
  id: string;
  userId: string | null;
  guestName: string | null;
  guestPhone: string | null;
  carMake: string;
  carModel: string;
  carYear: string;
  position: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; phone: string } | null;
}

export default function AdminDashboard() {
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData>({
    pendingRequests: 0,
    monthlyRequests: 0,
    newCustomersThisMonth: 0,
    monthlyRevenue: 0,
  });
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setRecentRequests(data.recentRequests);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try { await fetch("/api/monday/sync"); } finally { setTimeout(() => setSyncing(false), 2000); }
  };

  const kpis = [
    { label: "בקשות ממתינות", value: stats.pendingRequests, icon: ClipboardDocumentListIcon, color: "text-yellow-600 bg-yellow-50" },
    { label: "הזמנות החודש", value: stats.monthlyRequests, icon: CurrencyDollarIcon, color: "text-green-600 bg-green-50" },
    { label: "לקוחות חדשים", value: stats.newCustomersThisMonth, icon: UsersIcon, color: "text-blue-600 bg-blue-50" },
    { label: "הכנסה חודשית", value: formatPrice(stats.monthlyRevenue), icon: TruckIcon, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">דשבורד</h1>
          <p className="text-gray-500 mt-1">סקירה כללית של העסק</p>
        </div>
        <Button size="sm" variant="secondary" isLoading={syncing} onClick={handleSync} icon={<ArrowPathIcon className="w-4 h-4" />}>סנכרון מלאי</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${kpi.color}`}><kpi.icon className="w-6 h-6" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? "..." : kpi.value}
              </p>
              <p className="text-sm text-gray-500">{kpi.label}</p>
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">בקשות אחרונות</h2>
          <a href="/admin/requests" className="text-sm text-primary hover:underline flex items-center gap-1">הצג הכל <ArrowTopRightOnSquareIcon className="w-4 h-4" /></a>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <p className="text-center text-gray-400 py-8">טוען...</p>
          ) : recentRequests.length === 0 ? (
            <p className="text-center text-gray-400 py-8">אין בקשות עדיין</p>
          ) : (
            recentRequests.map((req) => {
              const status = getRequestStatusLabel(req.status);
              const name = req.user?.name || req.guestName || "אורח";
              const car = `${req.carMake} ${req.carModel} ${req.carYear}`;
              return (
                <a key={req.id} href={`/admin/requests/${req.id}`} className="flex items-center justify-between py-4 hover:bg-gray-50 -mx-6 px-6 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">{name.charAt(0)}</div>
                    <div><p className="font-medium text-gray-900">{name}</p><p className="text-sm text-gray-500">{car} - {getPositionLabel(req.position)}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>{status.label}</span>
                    <span className="text-xs text-gray-400">{formatRelativeTime(req.createdAt)}</span>
                  </div>
                </a>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
