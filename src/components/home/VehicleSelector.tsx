"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function VehicleSelector() {
  const router = useRouter();
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);

  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");

  // Fetch makes on mount
  useEffect(() => {
    fetch("/api/bumpers/makes")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMakes(data);
      })
      .catch(console.error);
  }, []);

  // Fetch models when make changes
  useEffect(() => {
    if (!selectedMake) { setModels([]); return; }
    fetch(`/api/bumpers/models?make=${encodeURIComponent(selectedMake)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setModels(data);
      })
      .catch(console.error);
  }, [selectedMake]);

  // Fetch years when model changes
  useEffect(() => {
    if (!selectedMake || !selectedModel) { setYears([]); return; }
    fetch(`/api/bumpers/years?make=${encodeURIComponent(selectedMake)}&model=${encodeURIComponent(selectedModel)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setYears(data);
      })
      .catch(console.error);
  }, [selectedMake, selectedModel]);

  const handleMakeChange = (value: string) => {
    setSelectedMake(value);
    setSelectedModel("");
    setSelectedYear("");
    setSelectedPosition("");
  };

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    setSelectedYear("");
    setSelectedPosition("");
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    setSelectedPosition("");
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedMake) params.set("make", selectedMake);
    if (selectedModel) params.set("model", selectedModel);
    if (selectedYear) params.set("year", selectedYear);
    if (selectedPosition) params.set("position", selectedPosition);
    router.push(`/catalog?${params.toString()}`);
  };

  const canSearch = selectedMake;

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
      {/* Header */}
      <div className="bg-primary px-6 py-4">
        <h2 className="text-white font-bold text-lg">חפשו טמבון לרכב שלכם</h2>
        <p className="text-white/70 text-sm">בחרו יצרן, דגם, שנה ומיקום</p>
      </div>

      {/* Dropdowns */}
      <div className="px-6 py-5">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          {/* Make */}
          <div className="flex-1">
            <select
              value={selectedMake}
              onChange={(e) => handleMakeChange(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border-2 border-border bg-white text-sm font-medium text-text appearance-none cursor-pointer hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            >
              <option value="">יצרן</option>
              {makes.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Model */}
          <div className="flex-1">
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              disabled={!selectedMake}
              className="w-full h-12 px-4 rounded-xl border-2 border-border bg-white text-sm font-medium text-text appearance-none cursor-pointer hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">דגם</option>
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div className="flex-1">
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              disabled={!selectedModel}
              className="w-full h-12 px-4 rounded-xl border-2 border-border bg-white text-sm font-medium text-text appearance-none cursor-pointer hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">שנה</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Position */}
          <div className="flex-1">
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              disabled={!selectedYear}
              className="w-full h-12 px-4 rounded-xl border-2 border-border bg-white text-sm font-medium text-text appearance-none cursor-pointer hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">מיקום</option>
              <option value="FRONT">קדמי</option>
              <option value="REAR">אחורי</option>
            </select>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={!canSearch}
            className="h-12 px-8 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
            חיפוש
          </button>
        </div>
      </div>
    </div>
  );
}
