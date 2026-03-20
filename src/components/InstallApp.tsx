"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { getGlobalDeferredPrompt, clearGlobalDeferredPrompt } from "./InstallButton";

export default function InstallApp() {
  const [showBanner, setShowBanner] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    // Check if dismissed recently (24 hours only — not 3 days)
    const dismissed = localStorage.getItem("dtm_install_dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed);
      if (Date.now() - dismissedAt < 24 * 60 * 60 * 1000) return;
    }

    // Detect platform
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      setPlatform("ios");
    } else if (/Android/.test(ua)) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }

    // Show banner after 3 seconds
    const timer = setTimeout(() => setShowBanner(true), 3000);

    // Listen for manual trigger from InstallButton
    const showHandler = () => {
      setShowGuide(true);
      setShowBanner(true);
    };
    window.addEventListener("dtm-show-install", showHandler);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("dtm-show-install", showHandler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    const deferredPrompt = getGlobalDeferredPrompt();

    // Native install available — one click!
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
        setInstalled(true);
      }
      clearGlobalDeferredPrompt();
      return;
    }

    // No native prompt — show guide
    setShowGuide(true);
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    setShowGuide(false);
    localStorage.setItem("dtm_install_dismissed", Date.now().toString());
  };

  if (installed || !showBanner) return null;

  return (
    <>
      {/* Install Banner — fixed at bottom */}
      {!showGuide && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-0 sm:bottom-6 sm:left-auto sm:right-6 sm:w-80">
          <div className="bg-primary text-white rounded-2xl shadow-2xl p-4 relative border border-white/10">
            <button
              onClick={handleDismiss}
              className="absolute top-2 left-2 p-1.5 rounded-full hover:bg-white/20 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-lg overflow-hidden">
                <img src="/images/icon-192.jpg" alt="DTM" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-base">התקינו את DTM PARTS</p>
                <p className="text-xs text-white/70">גישה מהירה — כמו אפליקציה!</p>
              </div>
            </div>
            <button
              onClick={handleInstall}
              className="w-full bg-white text-primary font-bold py-3 rounded-xl text-sm hover:bg-white/90 transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              {platform === "ios" ? "הוספה למסך הבית" : "התקן עכשיו"}
            </button>
          </div>
        </div>
      )}

      {/* Guide Modal — when native prompt not available */}
      {showGuide && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center" onClick={handleDismiss}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 pb-8 sm:mx-4" onClick={(e) => e.stopPropagation()}>

            {platform === "ios" ? (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">התקנה באייפון 📱</h3>
                <p className="text-sm text-gray-500 mb-5 text-center">3 צעדים פשוטים:</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-blue-50 rounded-xl p-3">
                    <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">1</span>
                    <p className="text-gray-700 text-sm">לחצו על כפתור <strong>השיתוף</strong> ⬆️ בתחתית Safari</p>
                  </div>
                  <div className="flex items-center gap-4 bg-blue-50 rounded-xl p-3">
                    <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">2</span>
                    <p className="text-gray-700 text-sm">גללו ובחרו <strong>&quot;הוסף למסך הבית&quot;</strong> ➕</p>
                  </div>
                  <div className="flex items-center gap-4 bg-blue-50 rounded-xl p-3">
                    <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">3</span>
                    <p className="text-gray-700 text-sm">לחצו <strong>&quot;הוסף&quot;</strong> — וזהו! ✅</p>
                  </div>
                </div>
              </>
            ) : platform === "android" ? (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">התקנה באנדרואיד 📱</h3>
                <p className="text-sm text-gray-500 mb-5 text-center">2 צעדים פשוטים:</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-green-50 rounded-xl p-3">
                    <span className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">1</span>
                    <p className="text-gray-700 text-sm">לחצו על <strong>⋮ שלוש נקודות</strong> למעלה בדפדפן</p>
                  </div>
                  <div className="flex items-center gap-4 bg-green-50 rounded-xl p-3">
                    <span className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">2</span>
                    <p className="text-gray-700 text-sm">בחרו <strong>&quot;התקן אפליקציה&quot;</strong> או <strong>&quot;הוסף למסך הבית&quot;</strong></p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">התקנה במחשב 💻</h3>
                <p className="text-sm text-gray-500 mb-5 text-center">2 צעדים פשוטים:</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-purple-50 rounded-xl p-3">
                    <span className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">1</span>
                    <p className="text-gray-700 text-sm">לחצו על <strong>אייקון ההתקנה</strong> 📥 בשורת הכתובת של הדפדפן</p>
                  </div>
                  <div className="flex items-center gap-4 bg-purple-50 rounded-xl p-3">
                    <span className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">2</span>
                    <p className="text-gray-700 text-sm">לחצו <strong>&quot;התקן&quot;</strong> — וזהו! ✅</p>
                  </div>
                </div>
              </>
            )}

            <button
              onClick={handleDismiss}
              className="mt-6 w-full bg-primary text-white font-bold py-3 rounded-xl text-base"
            >
              הבנתי, תודה!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
