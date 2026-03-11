"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import {
  Bars3Icon,
  XMarkIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-border"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <Image
              src="/images/logo.jpeg"
              alt={SITE_NAME}
              width={48}
              height={48}
              className="rounded-full"
            />
            <div className="hidden sm:block">
              <h1
                className={cn(
                  "text-xl font-bold transition-colors duration-300",
                  isScrolled ? "text-primary" : "text-white"
                )}
              >
                {SITE_NAME}
              </h1>
              <p
                className={cn(
                  "text-xs transition-colors duration-300",
                  isScrolled ? "text-text-secondary" : "text-white/70"
                )}
              >
                טמבונים ופגושים
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isScrolled
                    ? "text-text-secondary hover:text-primary hover:bg-primary/5"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <a
              href="tel:+972XXXXXXXXX"
              className={cn(
                "hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                isScrolled
                  ? "text-primary hover:bg-primary/5"
                  : "text-white hover:bg-white/10"
              )}
            >
              <PhoneIcon className="w-4 h-4" />
              <span>התקשרו אלינו</span>
            </a>
            <Link href="/quote">
              <Button size="sm" variant={isScrolled ? "primary" : "accent"}>
                בקשת מחיר
              </Button>
            </Link>
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <XMarkIcon
                  className={cn(
                    "w-6 h-6",
                    isScrolled ? "text-text" : "text-white"
                  )}
                />
              ) : (
                <Bars3Icon
                  className={cn(
                    "w-6 h-6",
                    isScrolled ? "text-text" : "text-white"
                  )}
                />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden transition-all duration-300 overflow-hidden",
          isMobileMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="bg-white border-t border-border px-4 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-4 py-3 rounded-xl text-text-secondary hover:text-primary hover:bg-primary/5 font-medium transition-all"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="tel:+972XXXXXXXXX"
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-primary font-medium"
          >
            <PhoneIcon className="w-5 h-5" />
            התקשרו אלינו
          </a>
        </nav>
      </div>
    </header>
  );
}
