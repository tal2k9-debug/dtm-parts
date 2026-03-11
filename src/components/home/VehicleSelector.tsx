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

// Temporary mock data - will be replaced with real BumperCache data
const MOCK_DATA = {
  makes: ["יונדאי", "קיה", "טויוטה", "מזדה", "ניסאן", "שברולט", "פולקסווגן", "סקודה", "הונדה", "פורד"],
  models: {
    "יונדאי": ["i10", "i20", "i25", "i30", "i35", "טוסון", "סנטה פה", "קונה"],
    "קיה": ["פיקנטו", "ריו", "סיד", "ספורטאז'", "סורנטו", "ניירו"],
    "טויוטה": ["יאריס", "קורולה", "קאמרי", "C-HR", "ראב 4", "לנד קרוזר"],
    "מזדה": ["2", "3", "6", "CX-3", "CX-5", "CX-30"],
    "ניסאן": ["מיקרה", "ג'וק", "קשקאי", "X-Trail", "ליף"],
    "שברולט": ["ספארק", "אוניקס", "טראקס", "אקווינוקס"],
    "פולקסווגן": ["פולו", "גולף", "טי-רוק", "טיגואן", "ID.3"],
    "סקודה": ["פאביה", "אוקטביה", "קמיק", "קרוק"],
    "הונדה": ["ג'אז", "סיוויק", "HR-V", "CR-V"],
    "פורד": ["פיאסטה", "פוקוס", "פומה", "קוגה"],
  } as Record<string, string[]>,
  years: ["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015"],
};

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

  const handleSelect = (key: string, value: string) => {
    const newSelection = { ...selection, [key]: value };
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
        return MOCK_DATA.makes;
      case "model":
        return selection.make ? MOCK_DATA.models[selection.make] || [] : [];
      case "year":
        return MOCK_DATA.years;
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
            {getOptions().map((option) => (
              <button
                key={option}
                onClick={() => handleSelect(steps[currentStep].key, option)}
                className="text-right px-4 py-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 text-sm font-medium text-text transition-all duration-200 active:scale-[0.98]"
              >
                {getDisplayLabel(option)}
              </button>
            ))}
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
