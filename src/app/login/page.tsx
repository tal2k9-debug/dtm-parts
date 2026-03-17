"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { SITE_NAME } from "@/lib/constants";
import { UserIcon, LockClosedIcon } from "@heroicons/react/24/outline";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, show option to stay or switch account
  const isAlreadyLoggedIn = status === "authenticated";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Sign out first if already logged in (switching accounts)
      if (isAlreadyLoggedIn) {
        await signOut({ redirect: false });
      }
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("שם משתמש או סיסמה שגויים");
      } else if (result?.ok === true) {
        router.push("/catalog");
      } else {
        setError("שם משתמש או סיסמה שגויים");
      }
    } catch {
      setError("שגיאה בהתחברות");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/catalog" });
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
          {isAlreadyLoggedIn && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl text-center">
              <p className="text-sm text-blue-800 mb-3">
                מחובר כ-<strong>{session?.user?.name}</strong>
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => router.push("/catalog")}
                  className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
                >
                  המשך לאתר
                </button>
                <button
                  onClick={() => signOut({ redirect: false }).then(() => window.location.reload())}
                  className="px-4 py-2 bg-white border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                >
                  התנתק והחלף חשבון
                </button>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="שם משתמש" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="הכנס שם משתמש" icon={<UserIcon className="w-5 h-5" />} required />
            <Input label="סיסמה" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="הכנס סיסמה" icon={<LockClosedIcon className="w-5 h-5" />} required />
            {error && <p className="text-sm text-danger text-center">{error}</p>}
            <Button type="submit" fullWidth isLoading={loading}>התחבר</Button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-border"></div>
            <span className="px-4 text-sm text-text-secondary">או</span>
            <div className="flex-1 border-t border-border"></div>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-border bg-white hover:bg-gray-50 transition-colors duration-200 text-sm font-medium text-gray-700"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            התחבר עם Google
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">אין לך חשבון? <Link href="/register" className="text-primary font-medium hover:underline">הירשם עכשיו</Link></p>
          </div>
        </Card>
        <p className="text-center mt-6"><Link href="/" className="text-sm text-text-secondary hover:text-primary transition-colors">חזרה לאתר</Link></p>
      </div>
    </div>
  );
}
