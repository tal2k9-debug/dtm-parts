"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import { SignalIcon, EyeIcon, UserIcon, DevicePhoneMobileIcon } from "@heroicons/react/24/outline";

interface OnlineSession {
  sessionId: string;
  userName: string;
  userPhone: string | null;
  isRegistered: boolean;
  currentPage: string | null;
  currentBumperId: string | null;
  currentBumperName: string | null;
  lastSeen: string;
}

const PAGE_LABELS: Record<string, string> = {
  "/": "דף הבית",
  "/catalog": "קטלוג",
  "/quote": "בקשת מחיר",
  "/register": "הרשמה",
  "/login": "התחברות",
  "/account": "החשבון שלי",
  "/terms": "תנאי שימוש",
  "/privacy": "מדיניות פרטיות",
};

function getPageLabel(path: string | null) {
  if (!path) return "לא ידוע";
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  if (path.startsWith("/catalog/")) return "צופה בטמבון";
  if (path.startsWith("/account/")) return "אזור אישי";
  return path;
}

export default function OnlinePage() {
  const [data, setData] = useState<{ online: number; sessions: OnlineSession[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    fetch("/api/online?detail=admin")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SignalIcon className="w-7 h-7 text-emerald-500" />
          גולשים אונליין
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">מתרענן כל 15 שניות</span>
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            className="text-sm text-primary hover:underline"
          >
            רענן
          </button>
        </div>
      </div>

      {/* Online Count */}
      <Card className="!bg-emerald-50 border-emerald-200">
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
            </span>
          </div>
          <p className="text-3xl font-extrabold text-emerald-700">
            {data?.online || 0}
          </p>
          <p className="text-emerald-600 font-medium">גולשים באתר כרגע</p>
        </div>
      </Card>

      {loading && !data ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-40 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-24" />
            </div>
          ))}
        </div>
      ) : !data?.sessions?.length ? (
        <Card>
          <p className="text-center text-gray-400 py-8">אין גולשים כרגע</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.sessions.map((s, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${s.isRegistered ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
                    {s.isRegistered ? <UserIcon className="w-5 h-5" /> : <DevicePhoneMobileIcon className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {s.userName}
                      {s.isRegistered && (
                        <span className="mr-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">רשום</span>
                      )}
                    </p>
                    {s.userPhone && (
                      <p className="text-sm text-gray-500">{s.userPhone}</p>
                    )}
                  </div>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5 text-sm text-gray-700">
                    <EyeIcon className="w-4 h-4" />
                    <span>{getPageLabel(s.currentPage)}</span>
                  </div>
                  {s.currentBumperName && (
                    <a
                      href={`/catalog/${s.currentBumperId}`}
                      className="text-xs text-primary hover:underline mt-1 block"
                    >
                      {s.currentBumperName}
                    </a>
                  )}
                  {s.currentBumperId && !s.currentBumperName && (
                    <a
                      href={`/catalog/${s.currentBumperId}`}
                      className="text-xs text-primary hover:underline mt-1 block"
                    >
                      טמבון #{s.currentBumperId}
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
