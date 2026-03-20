"use client";

import { useState, useEffect } from "react";
import { DevicePhoneMobileIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Check if dismissed before
    const dismissed = localStorage.getItem("dtm_install_dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed);
      // Show again after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    // iOS detection
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // On iOS, show after 3 seconds
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Desktop — listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem("dtm_install_dismissed", Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-in slide-in-from-bottom-4">
        <div className="bg-primary text-white rounded-2xl shadow-2xl p-4 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-2 left-2 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0">
              <DevicePhoneMobileIcon className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">התקינו את DTM PARTS</p>
              <p className="text-xs text-white/70">גישה מהירה מהמסך הראשי</p>
            </div>
          </div>
          <button
            onClick={handleInstall}
            className="mt-3 w-full bg-white text-primary font-bold py-2.5 rounded-xl text-sm hover:bg-white/90 transition-colors"
          >
            {isIOS ? "איך להתקין?" : "התקן עכשיו"}
          </button>
        </div>
      </div>

      {/* iOS Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center" onClick={handleDismiss}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:w-96 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">התקנה באייפון</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</span>
                <p className="text-sm text-gray-700">לחצו על כפתור <strong>השיתוף</strong> (החץ למעלה ⬆️) בתחתית הדפדפן</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</span>
                <p className="text-sm text-gray-700">גללו למטה ולחצו על <strong>&quot;הוסף למסך הבית&quot;</strong></p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</span>
                <p className="text-sm text-gray-700">לחצו <strong>&quot;הוסף&quot;</strong> — האייקון יופיע במסך הבית!</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="mt-6 w-full bg-primary text-white font-bold py-3 rounded-xl text-sm"
            >
              הבנתי, תודה!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
