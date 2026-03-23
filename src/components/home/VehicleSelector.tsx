"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

type SearchTab = "manual" | "plate";

interface VehicleInfo {
  plate: string;
  make: string;
  makeOriginal: string;
  model: string;
  year: number | null;
  color: string;
}

export default function VehicleSelector() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SearchTab>("manual");
  const SHOW_PLATE_SEARCH = false; // TODO: enable when plate search is ready

  // === Manual search state ===
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");

  // === Plate search state ===
  const [plateNumber, setPlateNumber] = useState("");
  const [plateLoading, setPlateLoading] = useState(false);
  const [plateError, setPlateError] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

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
    if (value && selectedMake) {
      const params = new URLSearchParams();
      params.set("make", selectedMake);
      if (selectedModel) params.set("model", selectedModel);
      params.set("year", value);
      router.push(`/catalog?${params.toString()}`);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedMake) params.set("make", selectedMake);
    if (selectedModel) params.set("model", selectedModel);
    if (selectedYear) params.set("year", selectedYear);
    if (selectedPosition) params.set("position", selectedPosition);
    router.push(`/catalog?${params.toString()}`);
  };

  // === Plate search ===
  const handlePlateLookup = async () => {
    if (!plateNumber.trim()) return;

    setPlateLoading(true);
    setPlateError("");
    setVehicleInfo(null);

    try {
      const res = await fetch(`/api/vehicle-lookup?plate=${encodeURIComponent(plateNumber.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setPlateError(data.error || "שגיאה בחיפוש");
        return;
      }

      setVehicleInfo(data);
      setShowConfirm(true);
    } catch {
      setPlateError("שגיאה בחיבור לשירות. נסה שוב.");
    } finally {
      setPlateLoading(false);
    }
  };

  const handlePositionSelect = (position: "FRONT" | "REAR") => {
    if (!vehicleInfo) return;
    setShowConfirm(false);

    const params = new URLSearchParams();
    params.set("make", vehicleInfo.make);
    if (vehicleInfo.model) params.set("plateModel", vehicleInfo.model);
    if (vehicleInfo.year) params.set("year", vehicleInfo.year.toString());
    params.set("position", position);
    params.set("plateSearch", "1");
    router.push(`/catalog?${params.toString()}`);
  };

  const canSearch = selectedMake;

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
      {/* Header */}
      <div className="bg-primary px-6 py-3">
        <h2 className="text-white font-bold text-lg text-center">חפשו טמבון לרכב שלכם</h2>
      </div>

      {/* Tab buttons */}
      {SHOW_PLATE_SEARCH && (
      <div className="flex gap-3 px-5 py-4 bg-gray-50 border-b border-gray-200">
        <button
          onClick={() => { setActiveTab("manual"); setShowConfirm(false); }}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all border-2 ${
            activeTab === "manual"
              ? "bg-primary text-white border-primary shadow-lg"
              : "bg-white text-gray-500 border-gray-200 hover:border-primary/40 hover:text-primary"
          }`}
        >
          🔍 חיפוש לפי יצרן ודגם
        </button>
        <button
          onClick={() => { setActiveTab("plate"); setShowConfirm(false); }}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all border-2 ${
            activeTab === "plate"
              ? "bg-primary text-white border-primary shadow-lg"
              : "bg-white text-gray-500 border-gray-200 hover:border-primary/40 hover:text-primary"
          }`}
        >
          🚗 חיפוש לפי מספר רכב
        </button>
      </div>
      )}

      {/* Subtitle */}
      <div className="px-6 pt-3">
        {activeTab === "manual" && (
          <p className="text-gray-400 text-xs text-center">בחרו יצרן, דגם, שנה ומיקום</p>
        )}
        {activeTab === "plate" && (
          <p className="text-gray-400 text-xs text-center">הזינו מספר רכב ונמצא לכם את הטמבון המתאים</p>
        )}
      </div>

      {/* Manual search */}
      {activeTab === "manual" && (
        <div className="px-6 py-5">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
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
            <div className="flex-1">
              <select
                value={selectedPosition}
                onChange={(e) => {
                  setSelectedPosition(e.target.value);
                  if (e.target.value && selectedMake) {
                    const params = new URLSearchParams();
                    params.set("make", selectedMake);
                    if (selectedModel) params.set("model", selectedModel);
                    if (selectedYear) params.set("year", selectedYear);
                    params.set("position", e.target.value);
                    router.push(`/catalog?${params.toString()}`);
                  }
                }}
                disabled={!selectedYear}
                className="w-full h-12 px-4 rounded-xl border-2 border-border bg-white text-sm font-medium text-text appearance-none cursor-pointer hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">מיקום</option>
                <option value="FRONT">קדמי</option>
                <option value="REAR">אחורי</option>
              </select>
            </div>
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
      )}

      {/* Plate search */}
      {activeTab === "plate" && (
        <div className="px-6 py-5">
          {!showConfirm ? (
            <>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                <div className="flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={plateNumber}
                    onChange={(e) => {
                      setPlateNumber(e.target.value);
                      setPlateError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handlePlateLookup()}
                    placeholder="הזינו מספר רכב (לדוגמה: 1234567)"
                    className="w-full h-14 px-5 rounded-xl border-2 border-border bg-white text-lg font-bold text-center text-text tracking-widest placeholder:text-sm placeholder:font-normal placeholder:tracking-normal hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    maxLength={10}
                    dir="ltr"
                  />
                </div>
                <button
                  onClick={handlePlateLookup}
                  disabled={!plateNumber.trim() || plateLoading}
                  className="h-14 px-10 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-base flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {plateLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <MagnifyingGlassIcon className="w-5 h-5" />
                  )}
                  {plateLoading ? "מחפש..." : "חפש"}
                </button>
              </div>
              {plateError && (
                <p className="text-red-500 text-sm mt-3 text-center font-medium">{plateError}</p>
              )}
            </>
          ) : vehicleInfo && (
            /* Confirmation popup */
            <div className="text-center py-2">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-4">
                <div className="text-blue-600 text-sm font-medium mb-2">הרכב שלך</div>
                <div className="text-2xl font-extrabold text-text mb-1">
                  {vehicleInfo.make} {vehicleInfo.model}
                </div>
                <div className="text-lg font-bold text-primary">
                  שנת {vehicleInfo.year}
                  {vehicleInfo.color && <span className="text-text-secondary font-normal"> • {vehicleInfo.color}</span>}
                </div>
                <div className="text-xs text-text-muted mt-2">מספר רכב: {vehicleInfo.plate}</div>
              </div>

              <p className="text-text font-bold text-lg mb-4">מה אתה מחפש?</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => handlePositionSelect("FRONT")}
                  className="flex-1 max-w-[200px] h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-base transition-all shadow-lg"
                >
                  מגן קדמי
                </button>
                <button
                  onClick={() => handlePositionSelect("REAR")}
                  className="flex-1 max-w-[200px] h-14 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-base transition-all shadow-lg"
                >
                  מגן אחורי
                </button>
              </div>
              <button
                onClick={() => { setShowConfirm(false); setVehicleInfo(null); setPlateNumber(""); }}
                className="mt-3 text-sm text-text-muted hover:text-text transition-colors"
              >
                ← חזרה לחיפוש
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
