"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import { getRequestStatusLabel, getPositionLabel, formatRelativeTime } from "@/lib/utils";
import { MagnifyingGlassIcon, PhoneIcon, ChatBubbleLeftIcon, EyeIcon } from "@heroicons/react/24/outline";

interface QuoteRequest {
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
  user: { id: string; name: string; phone: string; businessName: string | null; role: string } | null;
  _count: { messages: number };
}

export default function AdminRequestsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/quotes?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = requests.filter((r) => {
    if (!search) return true;
    const name = r.user?.name || r.guestName || "";
    const phone = r.user?.phone || r.guestPhone || "";
    const car = `${r.carMake} ${r.carModel}`;
    return name.includes(search) || phone.includes(search) || car.includes(search);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">בקשות מחיר</h1>
        <p className="text-gray-500 mt-1">{filtered.length} בקשות</p>
      </div>
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="חיפוש לפי שם, טלפון או רכב..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div className="w-48">
            <Select placeholder="כל הסטטוסים" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: "PENDING", label: "ממתין" }, { value: "QUOTED", label: "הצעת מחיר" }, { value: "CLOSED", label: "סגור" }, { value: "CANCELLED", label: "בוטל" }]} />
          </div>
        </div>
      </Card>
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-right py-3 px-4 font-medium text-gray-500">לקוח</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">רכב</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">מיקום</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">סטטוס</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">תאריך</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">טוען...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">אין בקשות</td></tr>
              ) : (
                filtered.map((req) => {
                  const status = getRequestStatusLabel(req.status);
                  const name = req.user?.name || req.guestName || "אורח";
                  const phone = req.user?.phone || req.guestPhone || "";
                  return (
                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs">{name.charAt(0)}</div>
                          <div><p className="font-medium text-gray-900">{name}</p><p className="text-xs text-gray-400">{phone}</p></div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{req.carMake} {req.carModel} {req.carYear}</td>
                      <td className="py-3 px-4 text-gray-600">{getPositionLabel(req.position)}</td>
                      <td className="py-3 px-4"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>{status.label}</span></td>
                      <td className="py-3 px-4 text-gray-400 text-xs">{formatRelativeTime(req.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <a href={`/admin/requests/${req.id}`} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"><EyeIcon className="w-4 h-4" /></a>
                          {phone && <a href={`tel:${phone}`} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"><PhoneIcon className="w-4 h-4" /></a>}
                          <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><ChatBubbleLeftIcon className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
