"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BumperCard from "@/components/catalog/BumperCard";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { Bumper } from "@/types";

export default function CatalogContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [filterMake, setFilterMake] = useState(searchParams.get("make") || "");
  const [filterModel, setFilterModel] = useState(searchParams.get("model") || "");
  const [filterYear, setFilterYear] = useState(searchParams.get("year") || "");
  const [filterPosition, setFilterPosition] = useState(searchParams.get("position") || "");
  const [filterStatus, setFilterStatus] = useState("במלאי");

  const [bumpers, setBumpers] = useState<Bumper[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const ITEMS_PER_PAGE = 24;

  // Fetch user favorites
  useEffect(() => {
    if (!isLoggedIn) {
      setFavorites([]);
      return;
    }
    fetch("/api/favorites")
      .then((res) => res.json())
      .then((data) => {
        if (data.favorites && Array.isArray(data.favorites)) {
          setFavorites(data.favorites);
        }
      })
      .catch((err) => console.error("Error fetching favorites:", err));
  }, [isLoggedIn]);

  const handleToggleFavorite = async (bumperId: string) => {
    const isFav = favorites.includes(bumperId);
    // Optimistic update
    if (isFav) {
      setFavorites((prev) => prev.filter((id) => id !== bumperId));
    } else {
      setFavorites((prev) => [...prev, bumperId]);
    }

    try {
      const res = await fetch("/api/favorites", {
        method: isFav ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bumperId }),
      });
      if (!res.ok) {
        // Revert on error
        if (isFav) {
          setFavorites((prev) => [...prev, bumperId]);
        } else {
          setFavorites((prev) => prev.filter((id) => id !== bumperId));
        }
      }
    } catch {
      // Revert on error
      if (isFav) {
        setFavorites((prev) => [...prev, bumperId]);
      } else {
        setFavorites((prev) => prev.filter((id) => id !== bumperId));
      }
    }
  };

  // Fetch available makes for filter dropdown
  useEffect(() => {
    fetch("/api/bumpers/makes")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMakes(data);
      })
      .catch((err) => console.error("Error fetching makes:", err));
  }, []);

  // Fetch models when make changes
  useEffect(() => {
    if (!filterMake) {
      setModels([]);
      return;
    }
    fetch(`/api/bumpers/models?make=${encodeURIComponent(filterMake)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setModels(data);
      })
      .catch((err) => console.error("Error fetching models:", err));
  }, [filterMake]);

  // Fetch years when make+model change
  useEffect(() => {
    if (!filterMake || !filterModel) {
      setYears([]);
      return;
    }
    fetch(`/api/bumpers/years?make=${encodeURIComponent(filterMake)}&model=${encodeURIComponent(filterModel)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setYears(data);
      })
      .catch((err) => console.error("Error fetching years:", err));
  }, [filterMake, filterModel]);

  // Fetch bumpers with current filters
  const fetchBumpers = useCallback((pageNum: number, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    const params = new URLSearchParams();
    if (filterMake) params.set("make", filterMake);
    if (filterModel) params.set("model", filterModel);
    if (filterYear) params.set("year", filterYear);
    if (filterPosition) params.set("position", filterPosition);
    if (filterStatus) params.set("status", filterStatus);
    params.set("limit", String(ITEMS_PER_PAGE));
    params.set("page", String(pageNum));

    fetch(`/api/bumpers?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.bumpers && Array.isArray(data.bumpers)) {
          if (append) {
            setBumpers((prev) => [...prev, ...data.bumpers]);
          } else {
            setBumpers(data.bumpers);
          }
          setTotal(data.pagination?.total ?? data.bumpers.length);
        } else if (Array.isArray(data)) {
          if (append) {
            setBumpers((prev) => [...prev, ...data]);
          } else {
            setBumpers(data);
          }
          setTotal(data.length);
        }
      })
      .catch((err) => console.error("Error fetching bumpers:", err))
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [filterMake, filterModel, filterYear, filterPosition, filterStatus]);

  useEffect(() => {
    setPage(1);
    fetchBumpers(1, false);
  }, [fetchBumpers]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBumpers(nextPage, true);
  };

  const hasMore = bumpers.length < total;

  const clearFilters = () => {
    setFilterMake("");
    setFilterModel("");
    setFilterYear("");
    setFilterPosition("");
    setFilterStatus("");
  };

  const handleMakeChange = (value: string) => {
    setFilterMake(value);
    setFilterModel("");
    setFilterYear("");
  };

  const handleModelChange = (value: string) => {
    setFilterModel(value);
    setFilterYear("");
  };

  const hasFilters = filterMake || filterModel || filterYear || filterPosition || filterStatus;

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-text mb-2">
              קטלוג טמבונים
            </h1>
            <p className="text-text-secondary text-lg">
              {loading ? "טוען..." : `${total} טמבונים נמצאו`}
            </p>
          </div>

          <div className="bg-surface rounded-2xl border border-border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-5 h-5 text-text-secondary" />
                <span className="font-medium text-text">סינון</span>
              </div>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-accent hover:text-accent-dark flex items-center gap-1 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                  נקה סינון
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Select
                placeholder="כל היצרנים"
                value={filterMake}
                onChange={(e) => handleMakeChange(e.target.value)}
                options={makes.map((m) => ({ value: m, label: m }))}
              />
              <Select
                placeholder="כל הדגמים"
                value={filterModel}
                onChange={(e) => handleModelChange(e.target.value)}
                options={models.map((m) => ({ value: m, label: m }))}
              />
              <Select
                placeholder="כל השנים"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                options={years.map((y) => ({ value: y, label: y }))}
              />
              <Select
                placeholder="כל המיקומים"
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                options={[
                  { value: "FRONT", label: "קדמי" },
                  { value: "REAR", label: "אחורי" },
                ]}
              />
              <Select
                placeholder="כל הסטטוסים"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[
                  { value: "instock", label: "במלאי" },
                  { value: "outofstock", label: "אזל" },
                  { value: "בהזמנה", label: "בהזמנה" },
                ]}
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-surface rounded-2xl border border-border p-4">
                  <div className="shimmer h-48 rounded-xl mb-4" />
                  <div className="shimmer h-5 w-3/4 rounded mb-3" />
                  <div className="shimmer h-4 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : bumpers.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {bumpers.map((bumper) => (
                  <BumperCard key={bumper.id} bumper={bumper} isLoggedIn={isLoggedIn} isFavorited={favorites.includes(bumper.mondayItemId)} onToggleFavorite={handleToggleFavorite} />
                ))}
              </div>
              {hasMore && (
                <div className="text-center mt-10">
                  <p className="text-text-secondary text-sm mb-4">
                    מציג {bumpers.length} מתוך {total} טמבונים
                  </p>
                  <Button
                    variant="secondary"
                    onClick={handleLoadMore}
                    isLoading={loadingMore}
                  >
                    טען עוד
                  </Button>
                </div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                <MagnifyingGlassIcon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-text mb-2">
                לא נמצאו תוצאות
              </h3>
              <p className="text-text-secondary mb-6">
                אין במלאי כרגע — שלחו בקשה ונחזור אליכם
              </p>
              <Button variant="primary" onClick={() => (window.location.href = "/quote")}>
                שלחו בקשת מחיר
              </Button>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
