"use client";

import { useState, useEffect } from "react";

const POPULAR_MAKES = [
  "טויוטה", "יונדאי", "קיה", "מרצדס", "במו", "פולקסווגן",
  "סקודה", "מאזדה", "ניסן", "הונדה", "סוזוקי", "וולבו",
  "פורד", "אודי", "פיגו", "סיטרואן", "רנו", "סיאט",
  "אופל", "מיצובישי", "טסלה", "פיאט", "דאציה", "לקסוס",
];

interface VehicleSelectProps {
  make: string;
  model: string;
  yearFrom: number | null;
  yearTo: number | null;
  position: "FRONT" | "REAR" | null;
  onChange: (data: {
    make: string;
    model: string;
    yearFrom: number | null;
    yearTo: number | null;
    position: "FRONT" | "REAR" | null;
  }) => void;
}

export default function VehicleSelect({
  make,
  model,
  yearFrom,
  yearTo,
  position,
  onChange,
}: VehicleSelectProps) {
  const [models, setModels] = useState<string[]>([]);
  const [showAllMakes, setShowAllMakes] = useState(false);
  const [makeSearch, setMakeSearch] = useState("");

  // Fetch models when make changes
  useEffect(() => {
    if (!make) {
      setModels([]);
      return;
    }
    fetch(`/api/bumpers/models?make=${encodeURIComponent(make)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setModels(data);
      })
      .catch(() => {});
  }, [make]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  const filteredMakes = showAllMakes
    ? POPULAR_MAKES.filter((m) => !makeSearch || m.includes(makeSearch))
    : POPULAR_MAKES;

  return (
    <div className="space-y-6">
      {/* Make Selection */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">יצרן</h3>
        {!make ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              {filteredMakes.map((m) => (
                <button
                  key={m}
                  onClick={() => onChange({ make: m, model: "", yearFrom, yearTo, position })}
                  className="py-3 px-2 bg-white border-2 border-gray-200 rounded-xl text-center font-medium hover:border-blue-500 hover:bg-blue-50 transition-all text-sm"
                >
                  {m}
                </button>
              ))}
            </div>
            {!showAllMakes && (
              <button
                onClick={() => setShowAllMakes(true)}
                className="mt-2 text-blue-600 text-sm underline w-full text-center"
              >
                הצג עוד יצרנים
              </button>
            )}
            {showAllMakes && (
              <input
                type="text"
                placeholder="חפש יצרן..."
                value={makeSearch}
                onChange={(e) => setMakeSearch(e.target.value)}
                className="mt-2 w-full p-3 border rounded-xl text-center"
              />
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-xl font-bold text-lg">
              {make}
            </span>
            <button
              onClick={() => onChange({ make: "", model: "", yearFrom, yearTo, position })}
              className="text-gray-400 hover:text-red-500"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Model Selection */}
      {make && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3">דגם</h3>
          {!model ? (
            <div className="grid grid-cols-3 gap-2">
              {models.map((m) => (
                <button
                  key={m}
                  onClick={() => onChange({ make, model: m, yearFrom, yearTo, position })}
                  className="py-3 px-2 bg-white border-2 border-gray-200 rounded-xl text-center font-medium hover:border-blue-500 hover:bg-blue-50 transition-all text-sm"
                >
                  {m}
                </button>
              ))}
              {models.length === 0 && (
                <input
                  type="text"
                  placeholder="הקלד דגם..."
                  onChange={(e) => {
                    if (e.target.value.length > 1) {
                      onChange({ make, model: e.target.value, yearFrom, yearTo, position });
                    }
                  }}
                  className="col-span-3 p-3 border rounded-xl text-center"
                />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-xl font-bold text-lg">
                {model}
              </span>
              <button
                onClick={() => onChange({ make, model: "", yearFrom, yearTo, position })}
                className="text-gray-400 hover:text-red-500"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Year Range */}
      {make && model && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3">שנים</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-sm text-gray-500 mb-1 block text-center">מ-</label>
              <select
                value={yearFrom || ""}
                onChange={(e) =>
                  onChange({
                    make, model,
                    yearFrom: e.target.value ? parseInt(e.target.value) : null,
                    yearTo: yearTo || (e.target.value ? parseInt(e.target.value) + 3 : null),
                    position,
                  })
                }
                className="w-full p-3 border-2 rounded-xl text-center font-bold text-lg"
              >
                <option value="">בחר</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <span className="text-gray-400 text-2xl mt-5">—</span>
            <div className="flex-1">
              <label className="text-sm text-gray-500 mb-1 block text-center">עד</label>
              <select
                value={yearTo || ""}
                onChange={(e) =>
                  onChange({
                    make, model,
                    yearFrom,
                    yearTo: e.target.value ? parseInt(e.target.value) : null,
                    position,
                  })
                }
                className="w-full p-3 border-2 rounded-xl text-center font-bold text-lg"
              >
                <option value="">בחר</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Position */}
      {make && model && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3">מיקום</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onChange({ make, model, yearFrom, yearTo, position: "FRONT" })}
              className={`py-5 rounded-xl text-xl font-bold transition-all ${
                position === "FRONT"
                  ? "bg-blue-600 text-white border-2 border-blue-600 shadow-lg"
                  : "bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300"
              }`}
            >
              קדמי
            </button>
            <button
              onClick={() => onChange({ make, model, yearFrom, yearTo, position: "REAR" })}
              className={`py-5 rounded-xl text-xl font-bold transition-all ${
                position === "REAR"
                  ? "bg-blue-600 text-white border-2 border-blue-600 shadow-lg"
                  : "bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300"
              }`}
            >
              אחורי
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
