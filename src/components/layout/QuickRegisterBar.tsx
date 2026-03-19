"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { XMarkIcon, UserPlusIcon } from "@heroicons/react/24/outline";

export default function QuickRegisterBar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    username: "",
    password: "",
  });

  // Don't show for logged-in users or if dismissed
  if (status === "loading" || session?.user || dismissed) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!termsAccepted) {
      setError("יש לאשר את תנאי השימוש ומדיניות הפרטיות");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "שגיאה בהרשמה");
        setLoading(false);
        return;
      }

      // Auto sign in after registration
      const signInResult = await signIn("credentials", {
        redirect: false,
        username: form.username,
        password: form.password,
      });

      if (signInResult?.ok) {
        router.refresh();
      }
    } catch {
      setError("שגיאה בהרשמה, נסו שוב");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-primary/95 backdrop-blur-sm py-4 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UserPlusIcon className="w-5 h-5 text-primary-light" />
            <span className="font-bold text-white text-sm">הרשמה מהירה לאתר</span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="שם מלא *"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="flex-1 min-w-[100px] bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <input
            type="tel"
            placeholder="טלפון *"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="flex-1 min-w-[100px] bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <input
            type="text"
            placeholder="שם משתמש *"
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="flex-1 min-w-[100px] bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <input
            type="email"
            placeholder="מייל"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="flex-1 min-w-[100px] bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <input
            type="password"
            placeholder="סיסמא *"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="flex-1 min-w-[100px] bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-accent hover:bg-accent/90 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? "נרשם..." : "הרשמה"}
          </button>
        </form>

        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="quick-terms"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="w-4 h-4 rounded border-white/30 accent-accent shrink-0"
          />
          <label htmlFor="quick-terms" className="text-xs text-white/80">
            קראתי ואני מסכים/ה ל
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline text-primary-light hover:text-white mx-1">תנאי שימוש</a>
            ו
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-primary-light hover:text-white mx-1">מדיניות פרטיות</a>
          </label>
        </div>

        {error && (
          <p className="text-yellow-300 text-xs mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}
