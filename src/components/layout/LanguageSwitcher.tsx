"use client";

import { useEffect, useState, useRef } from "react";
import { GlobeAltIcon } from "@heroicons/react/24/outline";

const LANGUAGES = [
  { code: "iw", label: "עברית", flag: "🇮🇱" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: new (
          opts: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean },
          id: string
        ) => void;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load Google Translate script once
  useEffect(() => {
    if (loaded) return;

    window.googleTranslateElementInit = () => {
      if (window.google?.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "iw",
            includedLanguages: "iw,en,ru",
            autoDisplay: false,
          },
          "google_translate_element"
        );
      }
    };

    const script = document.createElement("script");
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
    setLoaded(true);
  }, [loaded]);

  const switchLanguage = (langCode: string) => {
    setOpen(false);

    // Find the Google Translate select element and change it
    const select = document.querySelector(".goog-te-combo") as HTMLSelectElement;
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event("change"));
    }
  };

  return (
    <div ref={ref} className="relative">
      {/* Hidden Google Translate element */}
      <div id="google_translate_element" className="hidden" />

      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
        aria-label="שפה"
      >
        <GlobeAltIcon className="w-4 h-4" />
        <span className="hidden sm:inline text-xs">שפה</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 min-w-[140px]">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLanguage(lang.code)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition-colors text-right"
            >
              <span className="text-base">{lang.flag}</span>
              <span className="text-sm text-gray-700 font-medium">{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
