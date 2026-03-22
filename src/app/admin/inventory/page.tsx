"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ArrowPathIcon, MagnifyingGlassIcon, PhotoIcon, XMarkIcon, StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
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
  imageUrls: string[];
  blobImageUrl: string | null;
  blobImageUrls: string[];
  lastSynced: string;
}

export default function AdminInventoryPage() {
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "instock" | "outofstock">("all");
  const [bumpers, setBumpers] = useState<Bumper[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [editingBumper, setEditingBumper] = useState<Bumper | null>(null);
  const [savingImage, setSavingImage] = useState(false);

  useEffect(() => {
    fetchBumpers(1, false);
  }, []);

  const fetchBumpers = async (pageNum: number, append: boolean) => {
    if (append) {
      setLoadingMore(true);
    }
    try {
      const res = await fetch(`/api/bumpers?limit=5000&page=${pageNum}`);
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

  const handleSetPrimary = async (bumper: Bumper, imageIndex: number) => {
    setSavingImage(true);
    try {
      const res = await fetch(`/api/admin/bumpers/${bumper.id}/reorder-images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryIndex: imageIndex, imageUrl: getImageUrl(bumper, imageIndex) }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update local state
        setBumpers((prev) =>
          prev.map((b) =>
            b.id === bumper.id
              ? {
                  ...b,
                  imageUrls: data.imageUrls,
                  blobImageUrls: data.blobImageUrls,
                  imageUrl: data.imageUrls[0] || b.imageUrl,
                  blobImageUrl: data.blobImageUrls[0] || b.blobImageUrl,
                }
              : b
          )
        );
        // Update editing bumper too
        setEditingBumper((prev) =>
          prev
            ? {
                ...prev,
                imageUrls: data.imageUrls,
                blobImageUrls: data.blobImageUrls,
                imageUrl: data.imageUrls[0] || prev.imageUrl,
                blobImageUrl: data.blobImageUrls[0] || prev.blobImageUrl,
              }
            : null
        );
      }
    } catch (error) {
      console.error("Failed to reorder images:", error);
    } finally {
      setSavingImage(false);
    }
  };

  const getImageUrl = (bumper: Bumper, index: number): string => {
    if (bumper.blobImageUrls && bumper.blobImageUrls[index]) {
      return bumper.blobImageUrls[index];
    }
    if (bumper.imageUrls && bumper.imageUrls[index]) {
      return bumper.imageUrls[index];
    }
    return "/images/bumper-placeholder.svg";
  };

  const getImageCount = (bumper: Bumper): number => {
    return Math.max(bumper.imageUrls?.length || 0, bumper.blobImageUrls?.length || 0);
  };

  const filtered = bumpers.filter((b) => {
    // Status filter
    if (statusFilter === "instock" && b.status !== "במלאי" && b.status !== "כן") return false;
    if (statusFilter === "outofstock" && b.status !== "אזל" && b.status !== "לא") return false;
    // Search filter
    if (!search) return true;
    return b.name.includes(search) || b.carMake.includes(search) || b.carModel.includes(search);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">מלאי טמבונים</h1>
          <p className="text-gray-500 mt-1">
            {loading ? "..." : `${filtered.length} מתוך ${total} פריטים`}
          </p>
        </div>
        <span className="text-xs text-gray-400">סנכרון אוטומטי כל 15 דקות</span>
      </div>
      <Card>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="חיפוש טמבון..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </Card>
      {/* Status filter tabs */}
      <div className="flex gap-2">
        {([
          { key: "all" as const, label: "הכל", count: bumpers.length },
          { key: "instock" as const, label: "במלאי", count: bumpers.filter(b => b.status === "במלאי" || b.status === "כן").length },
          { key: "outofstock" as const, label: "אזל", count: bumpers.filter(b => b.status === "אזל" || b.status === "לא").length },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              statusFilter === tab.key
                ? tab.key === "instock"
                  ? "bg-green-500 text-white shadow-sm"
                  : tab.key === "outofstock"
                  ? "bg-red-500 text-white shadow-sm"
                  : "bg-primary text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-right py-3 px-4 font-medium text-gray-500">תמונה</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">שם</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">יצרן</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">דגם</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">שנה</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">מיקום</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">מחיר</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">סטטוס</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">
                    טוען...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">
                    אין פריטים
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-2 px-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 relative">
                        {(b.blobImageUrl || b.imageUrl) ? (
                          <Image
                            src={b.blobImageUrl || b.imageUrl || "/images/bumper-placeholder.svg"}
                            alt={b.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <PhotoIcon className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{b.name}</td>
                    <td className="py-3 px-4 text-gray-600">{b.carMake}</td>
                    <td className="py-3 px-4 text-gray-600">{b.carModel}</td>
                    <td className="py-3 px-4 text-gray-600">{b.carYear}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {b.position ? getPositionLabel(b.position) : "\u2014"}
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-medium">
                      {b.price ? formatPrice(b.price) : "\u2014"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          b.status === "במלאי"
                            ? "success"
                            : b.status === "אזל"
                            ? "danger"
                            : "warning"
                        }
                        dot
                      >
                        {b.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {getImageCount(b) > 1 && (
                        <button
                          onClick={() => setEditingBumper(b)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <PhotoIcon className="w-4 h-4" />
                          תמונות ({getImageCount(b)})
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {bumpers.length < total && !search && (
        <div className="text-center">
          <Button
            size="sm"
            variant="secondary"
            isLoading={loadingMore}
            onClick={handleLoadMore}
          >
            טען עוד ({bumpers.length} מתוך {total})
          </Button>
        </div>
      )}

      {/* Image Reorder Modal */}
      {editingBumper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  ניהול תמונות — {editingBumper.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {editingBumper.carMake} {editingBumper.carModel} {editingBumper.carYear}
                  {" · "}לחץ על כוכב כדי לבחור תמונה ראשית
                </p>
              </div>
              <button
                onClick={() => setEditingBumper(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: getImageCount(editingBumper) }).map((_, idx) => {
                  const isPrimary = idx === 0;
                  const imgUrl = getImageUrl(editingBumper, idx);
                  return (
                    <div
                      key={idx}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                        isPrimary
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="aspect-[4/3] relative bg-gray-100">
                        <Image
                          src={imgUrl}
                          alt={`תמונה ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                      </div>
                      {/* Primary badge */}
                      {isPrimary && (
                        <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                          <StarSolidIcon className="w-3 h-3" />
                          ראשית
                        </div>
                      )}
                      {/* Set as primary button */}
                      {!isPrimary && (
                        <button
                          onClick={() => handleSetPrimary(editingBumper, idx)}
                          disabled={savingImage}
                          className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-gray-600 hover:text-primary hover:bg-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 transition-all shadow-sm disabled:opacity-50"
                        >
                          <StarIcon className="w-3 h-3" />
                          קבע ראשית
                        </button>
                      )}
                      {/* Image number */}
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                        {idx + 1}/{getImageCount(editingBumper)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
