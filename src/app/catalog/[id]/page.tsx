"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import BumperCard from "@/components/catalog/BumperCard";
import { getPositionLabel, formatPrice } from "@/lib/utils";
import { ShoppingBagIcon, PhoneIcon, TruckIcon, ArrowRightIcon, HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { ADMIN_WHATSAPP_LINK, ADMIN_PHONE_INTL } from "@/lib/constants";
import { getManufacturerBySlug } from "@/lib/manufacturers";
import type { Bumper, BumperStatus } from "@/types";

export default function CatalogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const manufacturer = getManufacturerBySlug(id);

  if (manufacturer) {
    return <ManufacturerPage manufacturer={manufacturer} />;
  }

  return <BumperDetailPage id={id} />;
}

// ===== MANUFACTURER LANDING PAGE =====
function ManufacturerPage({ manufacturer }: { manufacturer: { slug: string; nameHe: string; nameEn: string; description: string; popularModels: string[] } }) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [bumpers, setBumpers] = useState<Bumper[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/bumpers?make=${encodeURIComponent(manufacturer.nameHe)}&limit=24&page=1&status=instock`)
      .then((res) => res.json())
      .then((data) => {
        if (data.bumpers) {
          setBumpers(data.bumpers);
          setTotal(data.pagination?.total || data.bumpers.length);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [manufacturer.nameHe]);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/api/favorites")
      .then((res) => res.json())
      .then((data) => {
        if (data.favorites && Array.isArray(data.favorites)) {
          setFavorites(data.favorites);
        }
      })
      .catch(() => {});
  }, [isLoggedIn]);

  const handleToggleFavorite = async (bumperId: string) => {
    const isFav = favorites.includes(bumperId);
    setFavorites((prev) => isFav ? prev.filter((id) => id !== bumperId) : [...prev, bumperId]);
    try {
      const res = await fetch("/api/favorites", {
        method: isFav ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bumperId }),
      });
      if (!res.ok) setFavorites((prev) => isFav ? [...prev, bumperId] : prev.filter((id) => id !== bumperId));
    } catch {
      setFavorites((prev) => isFav ? [...prev, bumperId] : prev.filter((id) => id !== bumperId));
    }
  };

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await fetch(`/api/bumpers?make=${encodeURIComponent(manufacturer.nameHe)}&limit=24&page=${nextPage}&status=instock`);
      const data = await res.json();
      if (data.bumpers) {
        setBumpers((prev) => [...prev, ...data.bumpers]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-text-secondary mb-6">
            <Link href="/" className="hover:text-primary transition-colors">ראשי</Link>
            <span>/</span>
            <Link href="/catalog" className="hover:text-primary transition-colors">קטלוג</Link>
            <span>/</span>
            <span className="text-text font-medium">{manufacturer.nameHe}</span>
          </nav>

          {/* SEO Content Header */}
          <div className="bg-gradient-to-l from-primary/5 to-primary/10 rounded-2xl p-6 sm:p-8 mb-8 border border-primary/10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text mb-3">
              פגושים וטמבונים ל{manufacturer.nameHe} — DTM PARTS
            </h1>
            <p className="text-text-secondary text-base sm:text-lg leading-relaxed mb-4 max-w-3xl">
              DTM PARTS מתמחה בייבוא פגושים, טמבונים ומגנים משומשים ל{manufacturer.nameHe}.
              {total > 0 ? ` כרגע ${total} פריטים במלאי` : " מלאי מתעדכן בזמן אמת"}.
              כל הפריטים עוברים בדיקה לפני שליחה. דגמים פופולריים: {manufacturer.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {manufacturer.popularModels.map((model) => (
                <span key={model} className="bg-white/80 text-text text-sm px-3 py-1.5 rounded-full border border-border">
                  {manufacturer.nameHe} {model}
                </span>
              ))}
            </div>
          </div>

          {/* Bumper Grid */}
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
              <p className="text-text-secondary text-sm mb-4">
                {total} פגושים וטמבונים ל{manufacturer.nameHe} במלאי
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {bumpers.map((bumper) => (
                  <BumperCard key={bumper.id} bumper={bumper} isLoggedIn={isLoggedIn} isFavorited={favorites.includes(bumper.mondayItemId)} onToggleFavorite={handleToggleFavorite} />
                ))}
              </div>
              {bumpers.length < total && (
                <div className="mt-8 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-base px-8 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loadingMore ? "טוען..." : "הציגו עוד טמבונים"}
                  </button>
                  <p className="text-text-secondary text-xs mt-2">מציג {bumpers.length} מתוך {total}</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <h2 className="text-xl font-bold text-text mb-2">אין פגושים ל{manufacturer.nameHe} במלאי כרגע</h2>
              <p className="text-text-secondary mb-6">שלחו בקשה ונמצא עבורכם</p>
              <Link href={`/quote?make=${encodeURIComponent(manufacturer.nameHe)}`}>
                <Button variant="primary" size="lg">שלחו בקשת מחיר</Button>
              </Link>
            </div>
          )}

          {/* SEO footer text */}
          <div className="mt-12 bg-surface rounded-2xl border border-border p-6">
            <h2 className="text-lg font-bold text-text mb-3">
              קניית פגושים וטמבונים ל{manufacturer.nameHe} ב-DTM PARTS
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              DTM PARTS היא חנות חלקי חילוף לרכב המתמחה בפגושים, טמבונים ומגנים משומשים מייבוא.
              אנו מציעים מגוון רחב של פגושים ל{manufacturer.nameHe} — קדמיים ואחוריים, לדגמים כמו {manufacturer.description}.
              כל הפריטים עוברים בדיקת איכות לפני שליחה, והמשלוח מתבצע לכל הארץ תוך 24-48 שעות.
              לא מצאתם את מה שחיפשתם? שלחו לנו בקשה ונמצא עבורכם.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

// ===== BUMPER DETAIL PAGE =====
function BumperDetailPage({ id }: { id: string }) {
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
                    alt={`פגוש ${bumper.carMake} ${bumper.carModel} ${bumper.carYear} - ${bumper.name}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <TruckIcon className="w-24 h-24 text-gray-300" />
                )}
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
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
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
                <a href={`${ADMIN_WHATSAPP_LINK}?text=${encodeURIComponent(`היי, אני מעוניין בטמבון מספר ${bumper.name}\n${bumper.carMake} ${bumper.carModel} ${bumper.carYear} — ${bumper.position ? getPositionLabel(bumper.position) : ""}\nhttps://dtm-parts.com/catalog/${id}`)}`} target="_blank" rel="noopener noreferrer">
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
