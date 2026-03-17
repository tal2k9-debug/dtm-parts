"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { getPositionLabel, formatPrice } from "@/lib/utils";
import { ShoppingBagIcon, PhoneIcon, TruckIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import type { Bumper, BumperStatus } from "@/types";

export default function CatalogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [bumper, setBumper] = useState<Bumper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

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
              <div className="bg-gray-100 rounded-2xl aspect-square flex items-center justify-center overflow-hidden mb-3">
                {(bumper.imageUrls?.length > 0 || bumper.imageUrl) ? (
                  <img
                    src={bumper.imageUrls?.[selectedImage] || bumper.imageUrl || ""}
                    alt={bumper.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <TruckIcon className="w-24 h-24 text-gray-300" />
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
                      <img src={url} alt={`${bumper.name} ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-6">
              <div>
                <Badge variant={statusValue === "במלאי" ? "success" : statusValue === "אזל" ? "danger" : "warning"} dot className="mb-3">{bumper.status}</Badge>
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
                <Link href={`/quote?make=${encodeURIComponent(bumper.carMake)}&model=${encodeURIComponent(bumper.carModel)}&year=${encodeURIComponent(bumper.carYear)}&position=${bumper.position || ""}`}>
                  <Button fullWidth size="lg" icon={<ShoppingBagIcon className="w-5 h-5" />}>שלח בקשת מחיר</Button>
                </Link>
                <a href="https://wa.me/972501234567" target="_blank">
                  <Button fullWidth size="lg" variant="whatsapp" className="mt-3">שלח הודעה בוואטסאפ</Button>
                </a>
                <a href="tel:+972501234567">
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
