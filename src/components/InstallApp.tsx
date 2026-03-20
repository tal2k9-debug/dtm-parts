"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showChromeGuide, setShowChromeGuide] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Check if dismissed before
    const dismissed = localStorage.getItem("dtm_install_dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed);
      if (Date.now() - dismissedAt < 3 * 24 * 60 * 60 * 1000) return; // 3 days
    }

    // iOS detection
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for native install prompt (Android/Desktop Chrome/Edge)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Always show banner after 2 seconds — regardless of beforeinstallprompt
    const timer = setTimeout(() => setShowBanner(true), 2000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    // iOS — show Safari guide
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    // Native install available — one click!
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
      return;
    }

    // No native prompt (Firefox, first visit, etc.) — show Chrome guide
    setShowChromeGuide(true);
  }, [isIOS, deferredPrompt]);

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    setShowChromeGuide(false);
    localStorage.setItem("dtm_install_dismissed", Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Install Banner — always visible at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-0 sm:bottom-6 sm:left-auto sm:right-6 sm:w-80">
        <div className="bg-primary text-white rounded-2xl shadow-2xl p-4 relative border border-white/10">
          <button
            onClick={handleDismiss}
            className="absolute top-2 left-2 p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-lg">
              <ArrowDownTrayIcon className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-base">התקינו את DTM PARTS</p>
              <p className="text-xs text-white/70">גישה מהירה — כמו אפליקציה!</p>
            </div>
          </div>
          <button
            onClick={handleInstall}
            className="w-full bg-white text-primary font-bold py-3 rounded-xl text-sm hover:bg-white/90 transition-colors shadow-lg"
          >
            {isIOS ? "הוספה למסך הבית" : "התקן עכשיו"}
          </button>
        </div>
      </div>

      {/* iOS Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end justify-center" onClick={handleDismiss}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-5 text-center">התקנה באייפון</h3>
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <span className="bg-primary text-white w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0">1</span>
                <p className="text-gray-700">לחצו על כפתור <strong>השיתוף</strong> בתחתית Safari</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="bg-primary text-white w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0">2</span>
                <p className="text-gray-700">בחרו <strong>&quot;הוסף למסך הבית&quot;</strong></p>
              </div>
              <div className="flex items-center gap-4">
                <span className="bg-primary text-white w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0">3</span>
                <p className="text-gray-700">לחצו <strong>&quot;הוסף&quot;</strong> — זהו!</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="mt-6 w-full bg-primary text-white font-bold py-3 rounded-xl"
            >
              הבנתי!
            </button>
          </div>
        </div>
      )}

      {/* Chrome/Edge Guide Modal — when native prompt not available */}
      {showChromeGuide && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end justify-center" onClick={handleDismiss}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-5 text-center">התקנת האפליקציה</h3>
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <span className="bg-primary text-white w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0">1</span>
                <p className="text-gray-700">לחצו על <strong>תפריט הדפדפן</strong> (⋮ שלוש נקודות)</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="bg-primary text-white w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0">2</span>
                <p className="text-gray-700">בחרו <strong>&quot;התקן אפליקציה&quot;</strong> או <strong>&quot;הוסף למסך הבית&quot;</strong></p>
              </div>
              <div className="flex items-center gap-4">
                <span className="bg-primary text-white w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0">3</span>
                <p className="text-gray-700">אשרו — וזהו!</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="mt-6 w-full bg-primary text-white font-bold py-3 rounded-xl"
            >
              הבנתי!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
