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
  const [isInstalled, setIsInstalled] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    setReady(true);

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
    if (deferredPrompt) {
      // Native install — one click!
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  // Don't show if installed or not ready
  if (isInstalled || !ready) return null;

  // Only show the button when native install is available
  if (!deferredPrompt) return null;

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all",
        isScrolled
          ? "bg-accent text-white hover:bg-accent/90 shadow-md shadow-accent/30"
          : "bg-white text-primary hover:bg-white/90 shadow-md"
      )}
    >
      <ArrowDownTrayIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      <span className="hidden sm:inline">הורדת אפליקציה</span>
      <span className="sm:hidden">התקנה</span>
    </button>
  );
}
