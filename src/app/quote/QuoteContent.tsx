"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Image from "next/image";
import { CheckCircleIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { ADMIN_WHATSAPP_LINK, SITE_NAME } from "@/lib/constants";

const FALLBACK_MAKES = ["יונדאי", "קיה", "טויוטה", "מזדה", "ניסאן", "שברולט", "פולקסווגן", "סקודה", "הונדה", "פורד", "אחר"];
const FALLBACK_YEARS = Array.from({ length: 15 }, (_, i) => String(2024 - i));

export default function QuoteContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [makes, setMakes] = useState<string[]>(FALLBACK_MAKES);
  const [years, setYears] = useState<string[]>(FALLBACK_YEARS);
  const [makesLoaded, setMakesLoaded] = useState(false);

  const isLoggedIn = !!session?.user;

  const catalogNumber = searchParams.get("catalogNumber") || "";

  const [form, setForm] = useState({
    name: "",
    phone: "",
    carMake: searchParams.get("make") || "",
    carModel: searchParams.get("model") || "",
    carYear: searchParams.get("year") || "",
    position: searchParams.get("position") || "",
    licensePlate: "",
    notes: "",
  });

  // Fetch makes from DB
  useEffect(() => {
    async function fetchMakes() {
      try {
        const res = await fetch("/api/bumpers/makes");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setMakes(data);
          }
        }
      } catch {
        // Keep fallback
      } finally {
        setMakesLoaded(true);
      }
    }
    fetchMakes();
  }, []);

  // Fetch years when make and model change
  useEffect(() => {
    async function fetchYears() {
      if (!form.carMake || !form.carModel) {
        setYears(FALLBACK_YEARS);
        return;
      }
      try {
        const res = await fetch(
          `/api/bumpers/years?make=${encodeURIComponent(form.carMake)}&model=${encodeURIComponent(form.carModel)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setYears(data);
          } else {
            setYears(FALLBACK_YEARS);
          }
        }
      } catch {
        setYears(FALLBACK_YEARS);
      }
    }
    fetchYears();
  }, [form.carMake, form.carModel]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const payload: Record<string, string | undefined> = {
        carMake: form.carMake,
        carModel: form.carModel,
        carYear: form.carYear,
        position: form.position,
        licensePlate: form.licensePlate || undefined,
        catalogNumber: catalogNumber || undefined,
        notes: form.notes || undefined,
      };

      if (!isLoggedIn) {
        payload.name = form.name;
        payload.phone = form.phone;
      }

      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "שגיאה בשליחת הבקשה, נסו שוב");
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError("שגיאה בחיבור לשרת, נסו שוב מאוחר יותר");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <>
        <Header />
        <main className="pt-24 pb-16 min-h-screen bg-background flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md mx-auto px-4"
          >
            <Image
              src="/images/logo.jpeg"
              alt={SITE_NAME}
              width={72}
              height={72}
              className="rounded-full mx-auto mb-4"
            />
            <div className="w-16 h-16 mx-auto mb-6 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-text mb-3">הבקשה נשלחה בהצלחה!</h2>
            <p className="text-text-secondary mb-8">
              קיבלנו את הבקשה שלכם ונחזור אליכם עם הצעת מחיר בהקדם.
            </p>
            <div className="flex flex-col gap-3">
              <Button fullWidth variant="primary" onClick={() => (window.location.href = "/")}>
                חזרה לדף הראשי
              </Button>
              <a href={ADMIN_WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                <Button fullWidth variant="whatsapp">דברו איתנו בוואטסאפ</Button>
              </a>
            </div>
          </motion.div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-text mb-3">בקשת הצעת מחיר</h1>
              <p className="text-text-secondary text-lg">מלאו את הפרטים ונחזור אליכם תוך דקות</p>
            </div>

            <Card padding="lg">
              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLoggedIn && (
                  <div>
                    <h3 className="text-lg font-bold text-text mb-4">פרטים אישיים</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="שם מלא" placeholder="הזינו שם מלא" value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
                      <Input label="טלפון" placeholder="050-0000000" type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} required />
                    </div>
                  </div>
                )}

                {isLoggedIn && (
                  <div className="bg-success/10 text-success rounded-xl px-4 py-3 text-sm font-medium">
                    {`מחובר בתור ${(session?.user as Record<string, unknown>)?.name || "משתמש רשום"} — הפרטים ישלחו אוטומטית`}
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-text mb-4">פרטי הרכב</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select label="יצרן" placeholder="בחרו יצרן" value={form.carMake} onChange={(e) => updateField("carMake", e.target.value)} options={makes.map((m) => ({ value: m, label: m }))} required />
                    <Input label="דגם" placeholder="לדוגמה: i20, קורולה..." value={form.carModel} onChange={(e) => updateField("carModel", e.target.value)} required />
                    <Select label="שנה" placeholder="בחרו שנה" value={form.carYear} onChange={(e) => updateField("carYear", e.target.value)} options={years.map((y) => ({ value: y, label: y }))} required />
                    <Select label="מיקום הטמבון" placeholder="קדמי / אחורי" value={form.position} onChange={(e) => updateField("position", e.target.value)} options={[{ value: "FRONT", label: "קדמי" }, { value: "REAR", label: "אחורי" }]} required />
                  </div>
                  {!catalogNumber && (
                    <div className="mt-4">
                      <Input
                        label="מספר רכב"
                        placeholder="לדוגמה: 12-345-67"
                        value={form.licensePlate}
                        onChange={(e) => updateField("licensePlate", e.target.value)}
                        required
                      />
                      <p className="text-xs text-text-muted mt-1">מספר הרכב עוזר לנו לזהות בדיוק את החלק המתאים</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">הערות נוספות</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted resize-none"
                    rows={4}
                    placeholder="פרטים נוספים, מספר רכב, תמונה של הפגוש הנדרש..."
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                  />
                </div>

                {error && (
                  <div className="bg-danger/10 text-danger rounded-xl px-4 py-3 text-sm font-medium text-center">
                    {error}
                  </div>
                )}

                <Button type="submit" fullWidth size="lg" isLoading={isLoading} icon={<PaperAirplaneIcon className="w-5 h-5 rotate-180" />}>
                  שלחו בקשה
                </Button>
                <p className="text-xs text-text-muted text-center">בשליחת הטופס אתם מאשרים שנחזור אליכם בהקדם</p>
              </form>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
