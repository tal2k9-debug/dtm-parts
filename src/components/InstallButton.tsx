"use client";

import { useState, useEffect } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

// Store deferred prompt globally so both components can access it
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

export function getGlobalDeferredPrompt() {
  return globalDeferredPrompt;
}

export function clearGlobalDeferredPrompt() {
  globalDeferredPrompt = null;
}

export default function InstallButton() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hasDeferredPrompt, setHasDeferredPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      setHasDeferredPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Track scroll
    const scrollHandler = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", scrollHandler);
    scrollHandler();

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("scroll", scrollHandler);
    };
  }, []);

  const handleClick = async () => {
    if (globalDeferredPrompt) {
      await globalDeferredPrompt.prompt();
      const { outcome } = await globalDeferredPrompt.userChoice;
      if (outcome === "accepted") setIsInstalled(true);
      globalDeferredPrompt = null;
      setHasDeferredPrompt(false);
    } else {
      // Trigger the InstallApp modal
      window.dispatchEvent(new CustomEvent("dtm-show-install"));
    }
  };

  if (isInstalled) return null;

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all animate-pulse hover:animate-none",
        hasDeferredPrompt
          ? "bg-green-500 text-white hover:bg-green-600 shadow-md shadow-green-500/30"
          : isScrolled
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
