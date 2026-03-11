"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BumperCard from "@/components/catalog/BumperCard";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { Bumper } from "@/types";

const ALL_BUMPERS: Bumper[] = [
  { id: "1", mondayItemId: "001", name: "פגוש קדמי יונדאי i20", carMake: "יונדאי", carModel: "i20", carYear: "2021", position: "FRONT", price: 850, status: "במלאי", imageUrl: null, lastSynced: new Date() },
  { id: "2", mondayItemId: "002", name: "פגוש אחורי קיה ספורטאז'", carMake: "קיה", carModel: "ספורטאז'", carYear: "2022", position: "REAR", price: 1200, status: "במלאי", imageUrl: null, lastSynced: new Date() },
  { id: "3", mondayItemId: "003", name: "פגוש קדמי טויוטה קורולה", carMake: "טויוטה", carModel: "קורולה", carYear: "2023", position: "FRONT", price: 950, status: "בהזמנה", imageUrl: null, lastSynced: new Date() },
  { id: "4", mondayItemId: "004", name: "פגוש קדמי מזדה CX-5", carMake: "מזדה", carModel: "CX-5", carYear: "2020", position: "FRONT", price: 1100, status: "במלאי", imageUrl: null, lastSynced: new Date() },
  { id: "5", mondayItemId: "005", name: "פגוש אחורי ניסאן קשקאי", carMake: "ניסאן", carModel: "קשקאי", carYear: "2022", position: "REAR", price: null, status: "אזל", imageUrl: null, lastSynced: new Date() },
  { id: "6", mondayItemId: "006", name: "פגוש קדמי פולקסווגן גולף", carMake: "פולקסווגן", carModel: "גולף", carYear: "2021", position: "FRONT", price: 1350, status: "במלאי", imageUrl: null, lastSynced: new Date() },
  { id: "7", mondayItemId: "007", name: "פגוש קדמי סקודה אוקטביה", carMake: "סקודה", carModel: "אוקטביה", carYear: "2023", position: "FRONT", price: 980, status: "במלאי", imageUrl: null, lastSynced: new Date() },
  { id: "8", mondayItemId: "008", name: "פגוש אחורי הונדה CR-V", carMake: "הונדה", carModel: "CR-V", carYear: "2021", position: "REAR", price: 1450, status: "במלאי", imageUrl: null, lastSynced: new Date() },
];

export default function CatalogContent() {
  const searchParams = useSearchParams();
  const [filterMake, setFilterMake] = useState(searchParams.get("make") || "");
  const [filterPosition, setFilterPosition] = useState(searchParams.get("position") || "");
  const [filterStatus, setFilterStatus] = useState("");

  const makes = [...new Set(ALL_BUMPERS.map((b) => b.carMake))];

  const filtered = useMemo(() => {
    return ALL_BUMPERS.filter((b) => {
      if (filterMake && b.carMake !== filterMake) return false;
      if (filterPosition && b.position !== filterPosition) return false;
      if (filterStatus && b.status !== filterStatus) return false;
      return true;
    });
  }, [filterMake, filterPosition, filterStatus]);

  const clearFilters = () => {
    setFilterMake("");
    setFilterPosition("");
    setFilterStatus("");
  };

  const hasFilters = filterMake || filterPosition || filterStatus;

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
              {filtered.length} טמבונים נמצאו
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                placeholder="כל היצרנים"
                value={filterMake}
                onChange={(e) => setFilterMake(e.target.value)}
                options={makes.map((m) => ({ value: m, label: m }))}
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
                  { value: "במלאי", label: "במלאי" },
                  { value: "אזל", label: "אזל" },
                  { value: "בהזמנה", label: "בהזמנה" },
                ]}
              />
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((bumper) => (
                <BumperCard key={bumper.id} bumper={bumper} />
              ))}
            </div>
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
