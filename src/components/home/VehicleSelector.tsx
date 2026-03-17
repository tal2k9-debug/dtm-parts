"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import type { VehicleSelection } from "@/types";

const steps = [
  { key: "make", label: "יצרן", icon: "🚗" },
  { key: "model", label: "דגם", icon: "📋" },
  { key: "year", label: "שנה", icon: "📅" },
  { key: "position", label: "מיקום", icon: "🎯" },
] as const;

export default function VehicleSelector() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selection, setSelection] = useState<Partial<VehicleSelection>>({});
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch makes on mount
  useEffect(() => {
    setLoading(true);
    fetch("/api/bumpers/makes")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMakes(data);
      })
      .catch((err) => console.error("Error fetching makes:", err))
      .finally(() => setLoading(false));
  }, []);

  // Fetch models when make changes
  useEffect(() => {
    if (!selection.make) {
      setModels([]);
      return;
    }
    setLoading(true);
    fetch(`/api/bumpers/models?make=${encodeURIComponent(selection.make)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setModels(data);
      })
      .catch((err) => console.error("Error fetching models:", err))
      .finally(() => setLoading(false));
  }, [selection.make]);

  // Fetch years when model changes
  useEffect(() => {
    if (!selection.make || !selection.model) {
      setYears([]);
      return;
    }
    setLoading(true);
    fetch(
      `/api/bumpers/years?make=${encodeURIComponent(selection.make)}&model=${encodeURIComponent(selection.model)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setYears(data);
      })
      .catch((err) => console.error("Error fetching years:", err))
      .finally(() => setLoading(false));
  }, [selection.make, selection.model]);

  const handleSelect = (key: string, value: string) => {
    const newSelection = { ...selection, [key]: value };
    // Clear dependent selections when a parent changes
    if (key === "make") {
      delete newSelection.model;
      delete newSelection.year;
      delete newSelection.position;
    } else if (key === "model") {
      delete newSelection.year;
      delete newSelection.position;
    } else if (key === "year") {
      delete newSelection.position;
    }
    setSelection(newSelection);

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSearch = () => {
    if (selection.make && selection.model && selection.year && selection.position) {
      const params = new URLSearchParams({
        make: selection.make,
        model: selection.model,
        year: selection.year,
        position: selection.position,
      });
      router.push(`/catalog?${params.toString()}`);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setSelection({});
    setCurrentStep(0);
  };

  const getOptions = (): string[] => {
    const step = steps[currentStep];
    switch (step.key) {
      case "make":
        return makes;
      case "model":
        return models;
      case "year":
        return years;
      case "position":
        return ["FRONT", "REAR"];
      default:
        return [];
    }
  };

  const getDisplayLabel = (value: string): string => {
    if (value === "FRONT") return "קדמי";
    if (value === "REAR") return "אחורי";
    return value;
  };

  const isComplete =
    selection.make && selection.model && selection.year && selection.position;

  const options = getOptions();

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
      {/* Header */}
      <div className="bg-primary px-6 py-4">
        <h2 className="text-white font-bold text-lg">חפשו טמבון לרכב שלכם</h2>
        <p className="text-white/70 text-sm">בחרו יצרן, דגם, שנה ומיקום</p>
      </div>

      {/* Progress */}
      <div className="px-6 pt-5">
        <div className="flex items-center gap-1">
          {steps.map((step, i) => (
            <div key={step.key} className="flex-1 flex items-center gap-1">
              <div
                className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                  i < currentStep
                    ? "bg-primary"
                    : i === currentStep
                    ? "bg-primary/50"
                    : "bg-gray-200"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Selected values display */}
        {currentStep > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selection.make && (
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                {selection.make}
              </span>
            )}
            {selection.model && (
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                {selection.model}
              </span>
            )}
            {selection.year && (
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                {selection.year}
              </span>
            )}
            {selection.position && (
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                {getDisplayLabel(selection.position)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Step Content */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5 text-text-secondary rotate-180" />
              </button>
            )}
            <span className="text-sm font-medium text-text-secondary">
              {steps[currentStep].icon} בחרו {steps[currentStep].label}
            </span>
          </div>
          {currentStep > 0 && (
            <button
              onClick={handleReset}
              className="text-xs text-text-muted hover:text-accent transition-colors"
            >
              התחל מחדש
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto"
          >
            {loading && options.length === 0 ? (
              <div className="col-span-2 py-8 text-center text-text-muted text-sm">
                טוען...
              </div>
            ) : options.length === 0 && steps[currentStep].key !== "position" ? (
              <div className="col-span-2 py-8 text-center text-text-muted text-sm">
                אין נתונים זמינים
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleSelect(steps[currentStep].key, option)}
                  className="text-right px-4 py-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 text-sm font-medium text-text transition-all duration-200 active:scale-[0.98]"
                >
                  {getDisplayLabel(option)}
                </button>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Search Button */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 pb-6"
        >
          <Button
            fullWidth
            size="lg"
            onClick={handleSearch}
            icon={<MagnifyingGlassIcon className="w-5 h-5" />}
          >
            חפשו טמבון
          </Button>
        </motion.div>
      )}
    </div>
  );
}
