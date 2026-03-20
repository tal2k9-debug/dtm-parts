"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getSessionId() {
  if (typeof window === "undefined") return null;
  let id = sessionStorage.getItem("dtm_session_id");
  if (!id) {
    id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem("dtm_session_id", id);
  }
  return id;
}

export default function PageTracker() {
  const pathname = usePathname();
  const lastPath = useRef("");

  // Track page views
  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;

    // Don't track admin pages
    if (pathname.startsWith("/admin")) return;

    const sessionId = getSessionId();
    fetch("/api/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "page_view",
        path: pathname,
        sessionId,
        referrer: document.referrer || null,
      }),
    }).catch(() => {});
  }, [pathname]);

  // Heartbeat — ping every 60 seconds with current page info
  useEffect(() => {
    const sessionId = getSessionId();

    const ping = () => {
      // Don't send heartbeat for admin pages
      if (window.location.pathname.startsWith("/admin")) return;

      // Check if viewing a bumper page
      const bumperMatch = window.location.pathname.match(/^\/catalog\/(\d+)$/);
      const bumperId = bumperMatch ? bumperMatch[1] : null;

      // Try to get bumper name from page title
      const bumperName = bumperId
        ? document.querySelector("h1")?.textContent || null
        : null;

      fetch("/api/online", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          page: window.location.pathname,
          bumperId,
          bumperName,
        }),
      }).catch(() => {});
    };

    ping();
    const interval = setInterval(ping, 60000);
    return () => clearInterval(interval);
  }, [pathname]);

  return null;
}
