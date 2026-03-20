"use client";

import { useState, useEffect } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Device detection
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
    setIsAndroid(/Android/.test(ua));

    // Listen for install prompt (Android/Desktop Chrome/Edge)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Track scroll for color
    const scrollHandler = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", scrollHandler);
    scrollHandler();

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("scroll", scrollHandler);
    };
  }, []);

  const handleClick = async () => {
    // If browser supports native install prompt, use it
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setIsInstalled(true);
      setDeferredPrompt(null);
      return;
    }
    // Otherwise show guide
    setShowGuide(true);
  };

  // Don't show if already installed as PWA
  if (isInstalled) return null;

  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all",
          isScrolled
            ? "bg-accent text-white hover:bg-accent/90 shadow-md shadow-accent/30"
            : "bg-white text-primary hover:bg-white/90 shadow-md"
        )}
      >
        <ArrowDownTrayIcon className="w-4 h-4" />
        <span className="hidden sm:inline">הורדת אפליקציה</span>
        <span className="sm:hidden">אפליקציה</span>
      </button>

      {/* Install Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setShowGuide(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:w-96 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">התקינו את DTM PARTS</h3>
            <p className="text-sm text-gray-500 text-center mb-5">גישה מהירה מהמסך הראשי — בדיוק כמו אפליקציה!</p>

            {isIOS ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</span>
                  <p className="text-sm text-gray-700 pt-1">לחצו על כפתור <strong>השיתוף</strong> ⬆️ בתחתית הדפדפן</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</span>
                  <p className="text-sm text-gray-700 pt-1">גללו ולחצו <strong>&quot;הוסף למסך הבית&quot;</strong> (Add to Home Screen)</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</span>
                  <p className="text-sm text-gray-700 pt-1">לחצו <strong>&quot;הוסף&quot;</strong> — האייקון יופיע במסך הבית!</p>
                </div>
              </div>
            ) : isAndroid ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</span>
                  <p className="text-sm text-gray-700 pt-1">לחצו על <strong>⋮ תפריט</strong> (3 נקודות למעלה)</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</span>
                  <p className="text-sm text-gray-700 pt-1">בחרו <strong>&quot;הוספה למסך הבית&quot;</strong> או <strong>&quot;התקנת אפליקציה&quot;</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</span>
                  <p className="text-sm text-gray-700 pt-1">אשרו — האפליקציה תופיע במסך הבית!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</span>
                  <p className="text-sm text-gray-700 pt-1">פתחו את האתר ב-<strong>Google Chrome</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</span>
                  <p className="text-sm text-gray-700 pt-1">לחצו על <strong>⋮ תפריט</strong> → <strong>&quot;התקנת DTM PARTS&quot;</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</span>
                  <p className="text-sm text-gray-700 pt-1">לחצו <strong>&quot;התקן&quot;</strong> — קיצור דרך יופיע בשולחן העבודה!</p>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuide(false)}
              className="mt-6 w-full bg-primary text-white font-bold py-3 rounded-xl text-sm hover:bg-primary/90 transition-colors"
            >
              הבנתי, תודה!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
