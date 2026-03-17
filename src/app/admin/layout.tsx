"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SITE_NAME, ADMIN_NAV_LINKS } from "@/lib/constants";
import {
  ChartBarIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  CubeIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

const navIcons: Record<string, React.ReactNode> = {
  "/admin": <ChartBarIcon className="w-5 h-5" />,
  "/admin/requests": <ClipboardDocumentListIcon className="w-5 h-5" />,
  "/admin/customers": <UsersIcon className="w-5 h-5" />,
  "/admin/inventory": <CubeIcon className="w-5 h-5" />,
  "/admin/chat": <ChatBubbleLeftRightIcon className="w-5 h-5" />,
  "/admin/settings": <Cog6ToothIcon className="w-5 h-5" />,
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const role = (session?.user as Record<string, unknown> | undefined)?.role;
      if (role !== "ADMIN") {
        router.push("/");
      }
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">טוען...</p>
      </div>
    );
  }

  const role = (session?.user as Record<string, unknown> | undefined)?.role;
  if (!session || role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full w-64 bg-primary-deeper text-white z-50 transition-transform duration-300 lg:translate-x-0 lg:static",
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <Link href="/admin" className="flex items-center gap-3">
              <Image
                src="/images/logo.jpeg"
                alt={SITE_NAME}
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>
                <h1 className="font-bold text-lg">{SITE_NAME}</h1>
                <p className="text-xs text-white/50">ניהול</p>
              </div>
            </Link>
            {/* Close button - mobile */}
            <button
              className="lg:hidden absolute top-4 left-4 text-white/70 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {ADMIN_NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/admin" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-white/60 hover:text-white hover:bg-white/8"
                  )}
                >
                  {navIcons[link.href]}
                  {link.label}
                  {link.href === "/admin/chat" && (
                    <span className="mr-auto bg-accent text-white text-xs px-2 py-0.5 rounded-full">
                      3
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all"
            >
              <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
              חזרה לאתר
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 lg:px-8 sticky top-0 z-30">
          <button
            className="lg:hidden p-2 -mr-2 text-gray-600 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <BellIcon className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
            </button>
            <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                ט
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">טל</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
