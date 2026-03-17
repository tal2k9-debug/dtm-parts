"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BumperCard from "@/components/catalog/BumperCard";
import Button from "@/components/ui/Button";
import { HeartIcon } from "@heroicons/react/24/outline";
import type { Bumper } from "@/types";

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoggedIn = !!session?.user;
  const [bumpers, setBumpers] = useState<Bumper[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch favorites and their bumper data
  useEffect(() => {
    if (!isLoggedIn) return;

    async function fetchFavorites() {
      try {
        const favRes = await fetch("/api/favorites");
        const favData = await favRes.json();

        if (!favData.favorites || favData.favorites.length === 0) {
          setFavorites([]);
          setBumpers([]);
          setLoading(false);
          return;
        }

        setFavorites(favData.favorites);

        // Fetch all bumpers and filter by favorites
        const bumpersRes = await fetch("/api/bumpers?limit=500");
        const bumpersData = await bumpersRes.json();
        const allBumpers: Bumper[] = bumpersData.bumpers || bumpersData || [];

        const favBumpers = allBumpers.filter((b: Bumper) =>
          favData.favorites.includes(b.mondayItemId)
        );
        setBumpers(favBumpers);
      } catch (err) {
        console.error("Error fetching favorites:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
  }, [isLoggedIn]);

  const handleToggleFavorite = async (bumperId: string) => {
    const isFav = favorites.includes(bumperId);
    // Optimistic update
    if (isFav) {
      setFavorites((prev) => prev.filter((id) => id !== bumperId));
      setBumpers((prev) => prev.filter((b) => b.mondayItemId !== bumperId));
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
        // Revert on error — reload the page data
        if (isFav) {
          setFavorites((prev) => [...prev, bumperId]);
        }
      }
    } catch {
      if (isFav) {
        setFavorites((prev) => [...prev, bumperId]);
      }
    }
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <>
        <Header />
        <main className="pt-24 pb-16 min-h-screen bg-background flex items-center justify-center">
          <p className="text-text-secondary">טוען...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-text mb-2">
              המועדפים שלי
            </h1>
            <p className="text-text-secondary text-lg">
              {bumpers.length > 0
                ? `${bumpers.length} טמבונים שמורים`
                : "עדיין לא שמרתם מועדפים"}
            </p>
          </div>

          {bumpers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {bumpers.map((bumper) => (
                <BumperCard
                  key={bumper.id}
                  bumper={bumper}
                  isLoggedIn={isLoggedIn}
                  isFavorited={favorites.includes(bumper.mondayItemId)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
                <HeartIcon className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-text mb-2">
                אין מועדפים עדיין
              </h3>
              <p className="text-text-secondary mb-6">
                לחצו על הלב בכרטיס טמבון כדי לשמור אותו כאן
              </p>
              <Button variant="primary" onClick={() => router.push("/catalog")}>
                לקטלוג הטמבונים
              </Button>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
