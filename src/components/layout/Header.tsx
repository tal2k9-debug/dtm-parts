"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { NAV_LINKS, SITE_NAME, ADMIN_PHONE_INTL } from "@/lib/constants";
import {
  Bars3Icon,
  XMarkIcon,
  PhoneIcon,
  UserPlusIcon,
  UserIcon,
  HeartIcon,
  ArrowRightStartOnRectangleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
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
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shrink-0 ring-2 ring-white/20">
              <Image
                src="/images/logo.jpeg"
                alt={SITE_NAME}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
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
                טמבונים / פגושים / מגנים
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
              href={`tel:${ADMIN_PHONE_INTL}`}
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
            {isLoggedIn ? (
              <>
                <span
                  className={cn(
                    "hidden sm:block text-sm font-medium transition-colors",
                    isScrolled ? "text-primary" : "text-white"
                  )}
                >
                  {`שלום, ${session?.user?.name || "אורח"}`}
                </span>
                <Link
                  href="/account/favorites"
                  className={cn(
                    "hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                    isScrolled
                      ? "text-red-500 hover:bg-red-50"
                      : "text-white hover:bg-white/10"
                  )}
                  title="מועדפים"
                >
                  <HeartIcon className="w-5 h-5" />
                </Link>
                <Link href="/account">
                  <Button size="sm" variant={isScrolled ? "outline" : "accent"} icon={<UserIcon className="w-4 h-4" />}>
                    החשבון שלי
                  </Button>
                </Link>
                {(session?.user as { role?: string })?.role === "ADMIN" && (
                  <Link href="/admin">
                    <Button size="sm" variant="accent" icon={<Cog6ToothIcon className="w-4 h-4" />}>
                      ניהול
                    </Button>
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className={cn(
                    "hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                    isScrolled
                      ? "text-gray-500 hover:text-red-500 hover:bg-red-50"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  )}
                  title="התנתק"
                >
                  <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
                </button>
              </>
            ) : (
              <Link href="/register" className="relative">
                <span className="absolute -inset-1 bg-accent/40 rounded-xl animate-ping opacity-25" />
                <Button size="sm" variant={isScrolled ? "outline" : "accent"} icon={<UserPlusIcon className="w-4 h-4" />}>
                  הרשמה — 10% הנחה
                </Button>
              </Link>
            )}
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
            href={`tel:${ADMIN_PHONE_INTL}`}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-primary font-medium"
          >
            <PhoneIcon className="w-5 h-5" />
            התקשרו אלינו
          </a>
          <div className="border-t border-border pt-3 mt-2">
            {isLoggedIn ? (
              <>
              <div className="px-4 py-2 text-sm font-bold text-primary">
                {`שלום, ${session?.user?.name || "אורח"} 👋`}
              </div>
              <Link
                href="/account/favorites"
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-red-500 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <HeartIcon className="w-5 h-5" />
                מועדפים
              </Link>
              <Link
                href="/account"
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-primary font-bold"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <UserIcon className="w-5 h-5" />
                החשבון שלי
              </Link>
              {(session?.user as { role?: string })?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-accent font-bold"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                  ניהול האתר
                </Link>
              )}
              <button
                onClick={() => { setIsMobileMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-medium w-full"
              >
                <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
                התנתק
              </button>
              </>
            ) : (
              <Link
                href="/register"
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-accent/10 text-accent font-bold"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <UserPlusIcon className="w-5 h-5" />
                הירשם וקבל 10% הנחה!
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
