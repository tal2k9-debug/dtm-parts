"use client";

import { useState, useEffect, useCallback } from "react";

interface AccessibilityPrefs {
  fontSize: number; // 0 = normal, 1 = large, 2 = extra large
  highContrast: boolean;
  grayscale: boolean;
  highlightLinks: boolean;
}

const DEFAULT_PREFS: AccessibilityPrefs = {
  fontSize: 0,
  highContrast: false,
  grayscale: false,
  highlightLinks: false,
};

const PREFS_KEY = "dtm_accessibility_prefs";

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(DEFAULT_PREFS);

  // Load saved preferences
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PREFS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AccessibilityPrefs;
        setPrefs(parsed);
        applyPrefs(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const applyPrefs = useCallback((p: AccessibilityPrefs) => {
    const body = document.body;

    // Font size
    body.classList.remove("a11y-font-large", "a11y-font-xl");
    if (p.fontSize === 1) body.classList.add("a11y-font-large");
    if (p.fontSize === 2) body.classList.add("a11y-font-xl");

    // High contrast
    body.classList.toggle("a11y-high-contrast", p.highContrast);

    // Grayscale
    body.classList.toggle("a11y-grayscale", p.grayscale);

    // Highlight links
    body.classList.toggle("a11y-highlight-links", p.highlightLinks);
  }, []);

  const updatePrefs = useCallback(
    (update: Partial<AccessibilityPrefs>) => {
      setPrefs((prev) => {
        const next = { ...prev, ...update };
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
        applyPrefs(next);
        return next;
      });
    },
    [applyPrefs]
  );

  const resetAll = useCallback(() => {
    localStorage.removeItem(PREFS_KEY);
    setPrefs(DEFAULT_PREFS);
    applyPrefs(DEFAULT_PREFS);
  }, [applyPrefs]);

  const cycleFontSize = (direction: "up" | "down") => {
    const current = prefs.fontSize;
    if (direction === "up" && current < 2) {
      updatePrefs({ fontSize: current + 1 });
    } else if (direction === "down" && current > 0) {
      updatePrefs({ fontSize: current - 1 });
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-1/2 -translate-y-1/2 z-50 bg-blue-700 hover:bg-blue-800 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
        aria-label="תפריט נגישות"
        title="נגישות"
      >
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm9 7h-6l-1.41 7.77L16 22h-2l-2-5-2 5H8l2.41-5.23L9 9H3V7h18v2z" />
        </svg>
      </button>

      {/* Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/30"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-blue-700 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">הגדרות נגישות</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white text-xl leading-none"
                aria-label="סגור"
              >
                &times;
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Font Size */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  גודל גופן
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => cycleFontSize("down")}
                    disabled={prefs.fontSize === 0}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-gray-700 font-bold text-lg transition-colors"
                    aria-label="הקטנת גופן"
                  >
                    א-
                  </button>
                  <span className="text-xs text-gray-500 w-6 text-center">
                    {prefs.fontSize === 0
                      ? "רגיל"
                      : prefs.fontSize === 1
                      ? "גדול"
                      : "XL"}
                  </span>
                  <button
                    onClick={() => cycleFontSize("up")}
                    disabled={prefs.fontSize === 2}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-gray-700 font-bold text-lg transition-colors"
                    aria-label="הגדלת גופן"
                  >
                    א+
                  </button>
                </div>
              </div>

              {/* High Contrast */}
              <ToggleOption
                label="ניגודיות גבוהה"
                active={prefs.highContrast}
                onClick={() =>
                  updatePrefs({ highContrast: !prefs.highContrast })
                }
              />

              {/* Grayscale */}
              <ToggleOption
                label="גווני אפור"
                active={prefs.grayscale}
                onClick={() => updatePrefs({ grayscale: !prefs.grayscale })}
              />

              {/* Highlight Links */}
              <ToggleOption
                label="הדגשת קישורים"
                active={prefs.highlightLinks}
                onClick={() =>
                  updatePrefs({ highlightLinks: !prefs.highlightLinks })
                }
              />

              {/* Reset */}
              <button
                onClick={resetAll}
                className="w-full mt-2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors"
              >
                איפוס הגדרות
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function ToggleOption({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
        active
          ? "bg-blue-50 text-blue-700 border border-blue-200"
          : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent"
      }`}
    >
      <span>{label}</span>
      <span
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          active ? "border-blue-600 bg-blue-600" : "border-gray-300"
        }`}
      >
        {active && (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </span>
    </button>
  );
}
