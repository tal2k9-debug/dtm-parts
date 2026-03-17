"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { SITE_NAME } from "@/lib/constants";
import { UserIcon, LockClosedIcon } from "@heroicons/react/24/outline";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) setError("שם משתמש או סיסמה שגויים");
      else window.location.href = "/account";
    } catch {
      setError("שגיאה בהתחברות");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <Image src="/images/logo.jpeg" alt={SITE_NAME} width={64} height={64} className="rounded-full mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-text">התחברות</h1>
          <p className="text-text-secondary mt-1">התחבר לאזור האישי שלך</p>
        </div>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="שם משתמש" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="הכנס שם משתמש" icon={<UserIcon className="w-5 h-5" />} required />
            <Input label="סיסמה" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="הכנס סיסמה" icon={<LockClosedIcon className="w-5 h-5" />} required />
            {error && <p className="text-sm text-danger text-center">{error}</p>}
            <Button type="submit" fullWidth isLoading={loading}>התחבר</Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">אין לך חשבון? <Link href="/register" className="text-primary font-medium hover:underline">הירשם עכשיו</Link></p>
          </div>
        </Card>
        <p className="text-center mt-6"><Link href="/" className="text-sm text-text-secondary hover:text-primary transition-colors">חזרה לאתר</Link></p>
      </div>
    </div>
  );
}