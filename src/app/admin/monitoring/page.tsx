"use client";

import { useState, useEffect, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ServerIcon,
  CloudIcon,
  ChatBubbleLeftIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

interface HealthData {
  status: "healthy" | "degraded" | "down";
  timestamp: string;
  responseMs: number;
  services: {
    database: { ok: boolean; latencyMs: number };
    monday: { ok: boolean; latencyMs: number };
    sync: { ok: boolean; lastSync: string | null; itemCount: number };
    circuits: {
      monday: { state: string; failures: number };
      whatsapp: { state: string; failures: number };
      pusher: { state: string; failures: number };
    };
  };
  errors?: {
    errorCount: number;
    criticalCount: number;
    recentErrors: SystemEvent[];
  };
}

interface SystemEvent {
  id: string;
  level: string;
  source: string;
  message: string;
  details: string | null;
  resolved: boolean;
  autoHealed: boolean;
  healAction: string | null;
  createdAt: string;
}

export default function MonitoringPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "error" | "critical" | "warn">("all");

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [healthRes, eventsRes] = await Promise.all([
        fetch("/api/health"),
        fetch(`/api/admin/events?limit=50${filter !== "all" ? `&level=${filter}` : ""}&resolved=false`),
      ]);

      if (healthRes.ok) setHealth(await healthRes.json());
      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(data.events || []);
        setUnresolvedCount(data.unresolvedCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch monitoring data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  const resolveEvent = async (eventId: string) => {
    await fetch("/api/admin/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    fetchData();
  };

  const resolveAll = async () => {
    await fetch("/api/admin/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolveAll: true }),
    });
    fetchData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-600 bg-green-50";
      case "degraded": return "text-yellow-600 bg-yellow-50";
      case "down": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "healthy": return "תקין";
      case "degraded": return "חלקי";
      case "down": return "מושבת";
      default: return status;
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "critical": return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case "error": return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case "warn": return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      default: return <CheckCircleIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getCircuitLabel = (state: string) => {
    switch (state) {
      case "closed": return { label: "תקין", variant: "success" as const };
      case "open": return { label: "מנותק", variant: "danger" as const };
      case "half-open": return { label: "בבדיקה", variant: "warning" as const };
      default: return { label: state, variant: "neutral" as const };
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("he-IL", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", second: "2-digit", day: "2-digit", month: "2-digit" });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">ניטור מערכת</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="shimmer h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניטור מערכת</h1>
          <p className="text-gray-500 mt-1">מעקב אחר שירותים, שגיאות וריפוי עצמי</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          isLoading={refreshing}
          onClick={() => fetchData(true)}
          icon={<ArrowPathIcon className="w-4 h-4" />}
        >
          רענן
        </Button>
      </div>

      {/* Overall Status */}
      {health && (
        <Card className={`border-2 ${health.status === "healthy" ? "border-green-200" : health.status === "degraded" ? "border-yellow-200" : "border-red-200"}`}>
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${getStatusColor(health.status)}`}>
              {health.status === "healthy" ? (
                <ShieldCheckIcon className="w-8 h-8" />
              ) : health.status === "degraded" ? (
                <ExclamationTriangleIcon className="w-8 h-8" />
              ) : (
                <XCircleIcon className="w-8 h-8" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {getStatusLabel(health.status)}
              </h2>
              <p className="text-sm text-gray-500">
                זמן תגובה: {health.responseMs}ms | עדכון אחרון: {formatTime(health.timestamp)}
              </p>
            </div>
            {unresolvedCount > 0 && (
              <div className="mr-auto">
                <Badge variant="danger" dot>{unresolvedCount} שגיאות פתוחות</Badge>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Services Grid */}
      {health && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <ServerIcon className="w-5 h-5 text-gray-500" />
              <h3 className="font-bold text-gray-900">מסד נתונים</h3>
            </div>
            <Badge variant={health.services.database.ok ? "success" : "danger"} dot>
              {health.services.database.ok ? "תקין" : "לא זמין"}
            </Badge>
            <p className="text-xs text-gray-400 mt-2">{health.services.database.latencyMs}ms</p>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-3">
              <CloudIcon className="w-5 h-5 text-gray-500" />
              <h3 className="font-bold text-gray-900">Monday.com</h3>
            </div>
            <Badge variant={health.services.monday.ok ? "success" : "danger"} dot>
              {health.services.monday.ok ? "תקין" : "לא זמין"}
            </Badge>
            <p className="text-xs text-gray-400 mt-2">
              {health.services.sync.itemCount} פריטים | {health.services.sync.lastSync ? `סנכרון: ${formatTime(health.services.sync.lastSync)}` : "לא סונכרן"}
            </p>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-3">
              <ChatBubbleLeftIcon className="w-5 h-5 text-gray-500" />
              <h3 className="font-bold text-gray-900">צ׳אט (Pusher)</h3>
            </div>
            {(() => {
              const c = getCircuitLabel(health.services.circuits.pusher.state);
              return <Badge variant={c.variant} dot>{c.label}</Badge>;
            })()}
            <p className="text-xs text-gray-400 mt-2">כשלונות: {health.services.circuits.pusher.failures}</p>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-3">
              <WrenchScrewdriverIcon className="w-5 h-5 text-gray-500" />
              <h3 className="font-bold text-gray-900">WhatsApp</h3>
            </div>
            {(() => {
              const c = getCircuitLabel(health.services.circuits.whatsapp.state);
              return <Badge variant={c.variant} dot>{c.label}</Badge>;
            })()}
            <p className="text-xs text-gray-400 mt-2">כשלונות: {health.services.circuits.whatsapp.failures}</p>
          </Card>
        </div>
      )}

      {/* Events Log */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">יומן אירועים</h2>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {(["all", "critical", "error", "warn"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {f === "all" ? "הכל" : f === "critical" ? "קריטי" : f === "error" ? "שגיאה" : "אזהרה"}
                </button>
              ))}
            </div>
            {unresolvedCount > 0 && (
              <Button size="sm" variant="secondary" onClick={resolveAll}>סמן הכל כטופל</Button>
            )}
          </div>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircleIcon className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-500">אין אירועים פתוחים</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {events.map((event) => (
              <div key={event.id} className="py-3 flex items-start gap-3">
                {getLevelIcon(event.level)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{event.message}</span>
                    {event.autoHealed && (
                      <Badge variant="info">
                        <WrenchScrewdriverIcon className="w-3 h-3 inline ml-1" />
                        תוקן אוטומטית
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">{event.source}</span>
                    <span className="text-xs text-gray-400">{formatTime(event.createdAt)}</span>
                    {event.healAction && (
                      <span className="text-xs text-green-600">{event.healAction}</span>
                    )}
                  </div>
                  {event.details && (
                    <details className="mt-1">
                      <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">פרטים</summary>
                      <pre className="text-xs text-gray-500 bg-gray-50 rounded p-2 mt-1 overflow-auto max-h-32 whitespace-pre-wrap" dir="ltr">
                        {(() => {
                          try { return JSON.stringify(JSON.parse(event.details), null, 2); }
                          catch { return event.details; }
                        })()}
                      </pre>
                    </details>
                  )}
                </div>
                <button
                  onClick={() => resolveEvent(event.id)}
                  className="text-xs text-gray-400 hover:text-green-600 px-2 py-1 rounded hover:bg-green-50 transition-colors whitespace-nowrap"
                >
                  סמן כטופל
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
