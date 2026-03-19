"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import BumperCard from "@/components/catalog/BumperCard";
import Button from "@/components/ui/Button";
import Link from "next/link";
import type { Bumper } from "@/types";

const PAGE_SIZE = 24;

export default function PopularBumpers() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [bumpers, setBumpers] = useState<Bumper[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/bumpers?limit=${PAGE_SIZE}&page=1&status=instock`)
      .then((res) => res.json())
      .then((data) => {
        if (data.bumpers && Array.isArray(data.bumpers)) {
          setBumpers(data.bumpers);
          setTotalCount(data.pagination?.total || data.bumpers.length);
          setHasMore(data.bumpers.length >= PAGE_SIZE);
        } else if (Array.isArray(data)) {
          setBumpers(data);
          setHasMore(data.length >= PAGE_SIZE);
        }
      })
      .catch((err) => console.error("Error fetching popular bumpers:", err))
      .finally(() => setLoading(false));
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/bumpers?limit=${PAGE_SIZE}&page=${nextPage}&status=instock`);
      const data = await res.json();
      if (data.bumpers && Array.isArray(data.bumpers)) {
        setBumpers((prev) => [...prev, ...data.bumpers]);
        setHasMore(data.bumpers.length >= PAGE_SIZE);
        setTotalCount(data.pagination?.total || 0);
        setPage((p) => p + 1);
      }
    } catch (err) {
      console.error("Error loading more bumpers:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore]);

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
        if (isFav) {
          setFavorites((prev) => [...prev, bumperId]);
        } else {
          setFavorites((prev) => prev.filter((id) => id !== bumperId));
        }
      }
    } catch {
      if (isFav) {
        setFavorites((prev) => [...prev, bumperId]);
      } else {
        setFavorites((prev) => prev.filter((id) => id !== bumperId));
      }
    }
  };

  return (
    <section className="py-6 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-5"
        >
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text mb-1">
              טמבונים במלאי
            </h2>
            <p className="text-text-secondary text-sm">
              {totalCount > 0 ? `${totalCount} פריטים במלאי` : "הפריטים הנמכרים ביותר שלנו"}
            </p>
          </div>
          <Link href="/catalog" className="hidden sm:block">
            <Button variant="secondary" size="sm">
              לקטלוג המלא
            </Button>
          </Link>
        </motion.div>

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

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-base px-8 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      טוען...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      הציגו עוד טמבונים
                    </>
                  )}
                </button>
                <p className="text-text-secondary text-xs mt-2">
                  מציג {bumpers.length} מתוך {totalCount}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-text-secondary">
            <p className="text-lg">אין טמבונים זמינים כרגע</p>
            <p className="text-sm mt-2">נסו שוב מאוחר יותר</p>
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link href="/catalog">
            <Button variant="secondary" fullWidth>
              לקטלוג המלא
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
