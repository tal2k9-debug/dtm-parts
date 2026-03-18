"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import BumperCard from "@/components/catalog/BumperCard";
import Button from "@/components/ui/Button";
import Link from "next/link";
import type { Bumper } from "@/types";

export default function PopularBumpers() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [bumpers, setBumpers] = useState<Bumper[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/bumpers?limit=12&status=instock")
      .then((res) => res.json())
      .then((data) => {
        if (data.bumpers && Array.isArray(data.bumpers)) {
          setBumpers(data.bumpers);
        } else if (Array.isArray(data)) {
          setBumpers(data);
        }
      })
      .catch((err) => console.error("Error fetching popular bumpers:", err))
      .finally(() => setLoading(false));
  }, []);

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
    <section className="py-12 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text mb-2">
              טמבונים פופולריים
            </h2>
            <p className="text-text-secondary text-lg">
              הפריטים הנמכרים ביותר שלנו
            </p>
          </div>
          <Link href="/catalog" className="hidden sm:block">
            <Button variant="secondary" size="sm">
              לקטלוג המלא
            </Button>
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-surface rounded-2xl border border-border p-4">
                <div className="shimmer h-48 rounded-xl mb-4" />
                <div className="shimmer h-5 w-3/4 rounded mb-3" />
                <div className="shimmer h-4 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : bumpers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {bumpers.map((bumper) => (
              <BumperCard key={bumper.id} bumper={bumper} isLoggedIn={isLoggedIn} isFavorited={favorites.includes(bumper.mondayItemId)} onToggleFavorite={handleToggleFavorite} />
            ))}
          </div>
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
