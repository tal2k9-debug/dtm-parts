"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const COOKIE_CONSENT_KEY = "dtm_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay so it animates in smoothly
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 p-4 animate-slide-up"
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-3xl mx-auto bg-gray-900 text-white rounded-2xl shadow-2xl px-6 py-4 flex flex-col sm:flex-row items-center gap-4">
        <p className="text-sm leading-relaxed text-white/90 flex-1">
          אתר זה משתמש בעוגיות (Cookies) לשיפור חוויית הגלישה ולצורכי ניתוח סטטיסטי.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleAccept}
            className="bg-accent hover:bg-accent/90 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            אישור
          </button>
          <Link
            href="/privacy"
            className="text-white/70 hover:text-white text-sm underline underline-offset-2 transition-colors"
          >
            מדיניות פרטיות
          </Link>
        </div>
      </div>
    </div>
  );
}
