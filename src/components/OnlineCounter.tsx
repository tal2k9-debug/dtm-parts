"use client";

import { useState, useEffect } from "react";

export default function OnlineCounter() {
  const [online, setOnline] = useState<number | null>(null);

  useEffect(() => {
    const fetchOnline = () => {
      fetch("/api/online")
        .then((r) => r.json())
        .then((d) => setOnline(d.online || 0))
        .catch(() => {});
    };

    fetchOnline();
    const interval = setInterval(fetchOnline, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (online === null || online === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span>{online} אונליין</span>
    </div>
  );
}
