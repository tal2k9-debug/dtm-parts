"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ArrowPathIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { getStatusBadge, getPositionLabel, formatPrice } from "@/lib/utils";

interface Bumper {
  id: string;
  mondayItemId: string;
  name: string;
  carMake: string;
  carModel: string;
  carYear: string;
  position: string | null;
  price: number | null;
  status: string;
  imageUrl: string | null;
  lastSynced: string;
}

export default function AdminInventoryPage() {
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [bumpers, setBumpers] = useState<Bumper[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchBumpers(1, false);
  }, []);

  const fetchBumpers = async (pageNum: number, append: boolean) => {
    if (append) {
      setLoadingMore(true);
    }
    try {
      const res = await fetch(`/api/bumpers?limit=100&page=${pageNum}`);
      const data = await res.json();
      if (data.bumpers) {
        if (append) {
          setBumpers((prev) => [...prev, ...data.bumpers]);
        } else {
          setBumpers(data.bumpers);
        }
        setTotal(data.pagination?.total ?? data.bumpers.length);
      }
    } catch (error) {
      console.error("Failed to fetch bumpers:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBumpers(nextPage, true);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/monday/sync");
      setPage(1);
      await fetchBumpers(1, false);
    } finally {
      setTimeout(() => setSyncing(false), 2000);
    }
  };

  const filtered = bumpers.filter((b) => {
    if (!search) return true;
    return b.name.includes(search) || b.carMake.includes(search) || b.carModel.includes(search);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">מלאי טמבונים</h1><p className="text-gray-500 mt-1">{loading ? "..." : `${filtered.length} מתוך ${total} פריטים`}</p></div>
        <Button size="sm" variant="secondary" isLoading={syncing} onClick={handleSync} icon={<ArrowPathIcon className="w-4 h-4" />}>סנכרון ממנדיי</Button>
      </div>
      <Card>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="חיפוש טמבון..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </Card>
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-right py-3 px-4 font-medium text-gray-500">שם</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">יצרן</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">דגם</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">שנה</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">מיקום</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">מחיר</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">סטטוס</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">טוען...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">אין פריטים</td></tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">{b.name}</td>
                    <td className="py-3 px-4 text-gray-600">{b.carMake}</td>
                    <td className="py-3 px-4 text-gray-600">{b.carModel}</td>
                    <td className="py-3 px-4 text-gray-600">{b.carYear}</td>
                    <td className="py-3 px-4 text-gray-600">{b.position ? getPositionLabel(b.position) : "\u2014"}</td>
                    <td className="py-3 px-4 text-gray-900 font-medium">{b.price ? formatPrice(b.price) : "\u2014"}</td>
                    <td className="py-3 px-4"><Badge variant={b.status === "במלאי" ? "success" : b.status === "אזל" ? "danger" : "warning"} dot>{b.status}</Badge></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {bumpers.length < total && !search && (
        <div className="text-center">
          <Button size="sm" variant="secondary" isLoading={loadingMore} onClick={handleLoadMore}>
            טען עוד ({bumpers.length} מתוך {total})
          </Button>
        </div>
      )}
    </div>
  );
}
