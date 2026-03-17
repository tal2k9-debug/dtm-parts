"use client";

import { useSession, signOut } from "next-auth/react";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";

export default function LogoutButton() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"
    >
      <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
      התנתק
    </button>
  );
}
