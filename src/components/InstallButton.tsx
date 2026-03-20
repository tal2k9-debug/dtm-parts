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
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // iOS detection
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for install prompt (Android/Desktop)
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
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  // Don't show if already installed
  if (isInstalled) return null;

  // On desktop Chrome/Edge without prompt, still show for iOS
  const canShow = deferredPrompt || isIOS;
  if (!canShow) return null;

  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all animate-pulse hover:animate-none",
          isScrolled
            ? "bg-accent text-white hover:bg-accent/90"
            : "bg-white text-primary hover:bg-white/90"
        )}
      >
        <ArrowDownTrayIcon className="w-4 h-4" />
        <span>התקן אפליקציה</span>
      </button>

      {/* iOS Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setShowIOSGuide(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:w-96 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">התקנת DTM PARTS</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</span>
                <p className="text-sm text-gray-700">לחצו על כפתור <strong>השיתוף</strong> (⬆️) בתחתית Safari</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</span>
                <p className="text-sm text-gray-700">גללו ולחצו <strong>&quot;הוסף למסך הבית&quot;</strong></p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</span>
                <p className="text-sm text-gray-700">לחצו <strong>&quot;הוסף&quot;</strong> — סיימתם!</p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-6 w-full bg-primary text-white font-bold py-3 rounded-xl text-sm"
            >
              הבנתי!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
