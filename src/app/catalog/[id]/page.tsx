"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { getPositionLabel, formatPrice } from "@/lib/utils";
import { ShoppingBagIcon, PhoneIcon, TruckIcon, ArrowRightIcon, HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { ADMIN_WHATSAPP_LINK, ADMIN_PHONE_INTL } from "@/lib/constants";
import type { Bumper, BumperStatus } from "@/types";

export default function CatalogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [bumper, setBumper] = useState<Bumper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/bumpers/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setBumper(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  // Track bumper view
  useEffect(() => {
    if (!bumper) return;
    fetch("/api/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "bumper_view", bumperId: bumper.mondayItemId }),
    }).catch(() => {});
  }, [bumper]);

  // Check if bumper is favorited
  useEffect(() => {
    if (!isLoggedIn || !bumper) return;
    fetch("/api/favorites")
      .then((res) => res.json())
      .then((data) => {
        if (data.favorites) {
          setIsFavorited(data.favorites.some((f: { bumperId: string }) => f.bumperId === bumper.mondayItemId));
        }
      })
      .catch(() => {});
  }, [isLoggedIn, bumper]);

  const toggleFavorite = async () => {
    if (!isLoggedIn || !bumper || favLoading) return;
    setFavLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: isFavorited ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bumperId: bumper.mondayItemId }),
      });
      if (res.ok) setIsFavorited(!isFavorited);
    } catch { /* ignore */ }
    finally { setFavLoading(false); }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-24 pb-16 min-h-screen bg-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="shimmer h-5 w-24 rounded mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="shimmer aspect-square rounded-2xl" />
              <div className="space-y-6">
                <div className="shimmer h-8 w-16 rounded-full mb-3" />
                <div className="shimmer h-10 w-3/4 rounded mb-2" />
                <div className="shimmer h-8 w-1/3 rounded" />
                <div className="shimmer h-32 rounded-xl" />
                <div className="shimmer h-14 rounded-xl" />
                <div className="shimmer h-14 rounded-xl" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !bumper) {
    return (
      <>
        <Header />
        <main className="pt-24 pb-16 min-h-screen bg-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
              <TruckIcon className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-text mb-2">הטמבון לא נמצא</h1>
            <p className="text-text-secondary mb-6">ייתכן שהפריט הוסר או שהקישור אינו תקין</p>
            <Link href="/catalog">
              <Button variant="primary">חזרה לקטלוג</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const statusValue = bumper.status as BumperStatus;

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/catalog" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary mb-6 transition-colors">
            <ArrowRightIcon className="w-4 h-4" />
            חזרה לקטלוג
          </Link>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              {/* Main image */}
              <div className="relative bg-gray-100 rounded-2xl aspect-square flex items-center justify-center overflow-hidden mb-3">
                {(bumper.imageUrls?.length > 0 || bumper.imageUrl) ? (
                  <img
                    src={bumper.imageUrls?.[selectedImage] || bumper.imageUrl || ""}
                    alt={bumper.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <TruckIcon className="w-24 h-24 text-gray-300" />
                )}
                {/* Floating favorite button on image */}
                {isLoggedIn && (
                  <button
                    onClick={toggleFavorite}
                    disabled={favLoading}
                    className="absolute top-3 left-3 p-2.5 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all"
                    title={isFavorited ? "הסר ממועדפים" : "הוסף למועדפים"}
                  >
                    {isFavorited ? (
                      <HeartSolid className="w-6 h-6 text-red-500" />
                    ) : (
                      <HeartIcon className="w-6 h-6 text-gray-500 hover:text-red-400" />
                    )}
                  </button>
                )}
              </div>
              {/* Thumbnails */}
              {bumper.imageUrls && bumper.imageUrls.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {bumper.imageUrls.map((url: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === i ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <img src={url} alt={`${bumper.name} ${i + 1}`} className="w-full h-full object-contain bg-gray-50" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={statusValue === "במלאי" ? "success" : statusValue === "אזל" ? "danger" : "warning"} dot>{bumper.status}</Badge>
                  {isLoggedIn && (
                    <button
                      onClick={toggleFavorite}
                      disabled={favLoading}
                      className="p-2 rounded-xl hover:bg-red-50 transition-colors"
                      title={isFavorited ? "הסר ממועדפים" : "הוסף למועדפים"}
                    >
                      {isFavorited ? (
                        <HeartSolid className="w-7 h-7 text-red-500" />
                      ) : (
                        <HeartIcon className="w-7 h-7 text-gray-400 hover:text-red-400" />
                      )}
                    </button>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-text mb-2">{bumper.name}</h1>
                {bumper.price && <p className="text-3xl font-bold text-primary">{formatPrice(bumper.price)}</p>}
              </div>
              <Card className="bg-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-text-muted">יצרן</p><p className="font-medium text-text">{bumper.carMake}</p></div>
                  <div><p className="text-xs text-text-muted">דגם</p><p className="font-medium text-text">{bumper.carModel}</p></div>
                  <div><p className="text-xs text-text-muted">שנה</p><p className="font-medium text-text">{bumper.carYear}</p></div>
                  <div><p className="text-xs text-text-muted">מיקום</p><p className="font-medium text-text">{bumper.position ? getPositionLabel(bumper.position) : "—"}</p></div>
                </div>
              </Card>
              <div className="space-y-3">
                <Link href={`/quote?make=${encodeURIComponent(bumper.carMake)}&model=${encodeURIComponent(bumper.carModel)}&year=${encodeURIComponent(bumper.carYear)}&position=${bumper.position || ""}&catalogNumber=${encodeURIComponent(bumper.name)}`}>
                  <Button fullWidth size="lg" icon={<ShoppingBagIcon className="w-5 h-5" />}>שלח בקשת מחיר</Button>
                </Link>
                <a href={ADMIN_WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                  <Button fullWidth size="lg" variant="whatsapp" className="mt-3">שלח הודעה בוואטסאפ</Button>
                </a>
                <a href={`tel:${ADMIN_PHONE_INTL}`}>
                  <Button fullWidth size="lg" variant="secondary" icon={<PhoneIcon className="w-5 h-5" />} className="mt-3">התקשרו אלינו</Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
