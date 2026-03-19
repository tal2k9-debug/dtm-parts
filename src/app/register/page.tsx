"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { SITE_NAME } from "@/lib/constants";
import {
  UserIcon,
  LockClosedIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  IdentificationIcon,
} from "@heroicons/react/24/outline";

export default function RegisterPage() {
  const router = useRouter();
  const [customerType, setCustomerType] = useState<"" | "private" | "business">("");
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    phone: "",
    email: "",
    businessName: "",
    businessAddress: "",
    businessId: "",
    businessType: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

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
        return;
      }

      // Registration successful - auto-login
      const loginResult = await signIn("credentials", {
        username: form.username,
        password: form.password,
        redirect: false,
      });

      if (loginResult?.ok === true) {
        router.push("/catalog");
      } else {
        // Fallback: redirect to login if auto-login fails
        router.push("/login?registered=true");
      }
    } catch {
      setError("שגיאה בהרשמה, נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-8">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img src="/images/DTM.png" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <Image
              src="/images/logo.jpeg"
              alt={SITE_NAME}
              width={80}
              height={80}
              className="rounded-full mx-auto"
            />
          </Link>
          <h1 className="text-2xl font-bold text-text">הרשמה</h1>
          <p className="text-text-secondary mt-1">צור חשבון חדש ב-DTM PARTS</p>
        </div>
        <Card>
          {/* Step 1: Choose customer type */}
          {!customerType && (
            <div className="space-y-3">
              <Link href="/login" className="block">
                <div className="w-full p-4 rounded-xl border-2 border-accent/30 bg-accent/5 hover:border-accent hover:bg-accent/10 transition-all duration-200 text-center">
                  <p className="font-bold text-accent text-lg">כבר יש לך חשבון? התחבר</p>
                </div>
              </Link>

              <p className="text-center text-text-secondary pt-2">הרשמה:</p>

              <button
                type="button"
                onClick={() => { setCustomerType("private"); updateField("businessType", "private"); }}
                className="w-full p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 text-right"
              >
                <div className="flex items-center gap-3">
                  <UserIcon className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-bold text-text text-lg">לקוח פרטי — הרשמה</p>
                    <p className="text-sm text-text-secondary">רכישה אישית של חלקים</p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setCustomerType("business")}
                className="w-full p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 text-right"
              >
                <div className="flex items-center gap-3">
                  <BuildingStorefrontIcon className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-bold text-text text-lg">לקוח עסקי — הרשמה</p>
                    <p className="text-sm text-text-secondary">מוסך, חברת ליסינג, סוכנות רכב, פחחות, סוחרי רכב וכו׳</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Step 2: Registration form */}
          {customerType && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <button
              type="button"
              onClick={() => setCustomerType("")}
              className="text-sm text-primary hover:underline mb-2"
            >
              ← חזרה לבחירת סוג חשבון
            </button>

            <div className="bg-primary/5 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-primary text-center">
                {customerType === "private" ? "👤 הרשמה כלקוח פרטי" : "🏢 הרשמה כלקוח עסקי"}
              </p>
            </div>

            <Input
              label="שם משתמש *"
              value={form.username}
              onChange={(e) => updateField("username", e.target.value)}
              placeholder="הכנס שם משתמש"
              icon={<UserIcon className="w-5 h-5" />}
              required
            />
            <Input
              label="סיסמה *"
              type="password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder="לפחות 6 תווים"
              icon={<LockClosedIcon className="w-5 h-5" />}
              required
              minLength={6}
            />
            <Input
              label="שם מלא *"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="הכנס שם מלא"
              icon={<UserIcon className="w-5 h-5" />}
              required
            />
            <Input
              label="טלפון *"
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="050-0000000"
              icon={<PhoneIcon className="w-5 h-5" />}
              required
            />
            <Input
              label="אימייל"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="email@example.com"
              icon={<EnvelopeIcon className="w-5 h-5" />}
            />

            {customerType === "business" && (
              <>
                <div className="border-t border-border pt-4 mt-4">
                  <p className="text-sm font-medium text-text mb-3">פרטי העסק</p>
                </div>
                <Select
                  label="סוג עסק *"
                  value={form.businessType}
                  onChange={(e) => updateField("businessType", e.target.value)}
                  placeholder="בחר סוג עסק"
                  options={[
                    { value: "garage", label: "מוסך" },
                    { value: "leasing", label: "חברת ליסינג" },
                    { value: "dealer", label: "סוכנות רכב" },
                    { value: "bodyshop", label: "פחחות / צבע" },
                    { value: "insurance", label: "חברת ביטוח" },
                    { value: "parts_store", label: "חנות חלפים" },
                    { value: "fleet", label: "מנהל צי רכב" },
                    { value: "other_business", label: "עסק אחר" },
                  ]}
                  required
                />
                <Input
                  label="שם העסק *"
                  value={form.businessName}
                  onChange={(e) => updateField("businessName", e.target.value)}
                  placeholder="שם העסק"
                  icon={<BuildingStorefrontIcon className="w-5 h-5" />}
                  required
                />
                <Input
                  label="כתובת העסק"
                  value={form.businessAddress}
                  onChange={(e) => updateField("businessAddress", e.target.value)}
                  placeholder="כתובת העסק"
                  icon={<MapPinIcon className="w-5 h-5" />}
                />
                <Input
                  label='ח.פ. / עוסק מורשה'
                  value={form.businessId}
                  onChange={(e) => updateField("businessId", e.target.value)}
                  placeholder="מספר חברה / עוסק"
                  icon={<IdentificationIcon className="w-5 h-5" />}
                />
              </>
            )}

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="register-terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 mt-1 rounded border-border accent-primary shrink-0"
              />
              <label htmlFor="register-terms" className="text-sm text-text-secondary">
                קראתי ואני מסכים/ה ל
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80 mx-1">תנאי שימוש</a>
                ו
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80 mx-1">מדיניות פרטיות</a>
              </label>
            </div>

            {error && (
              <p className="text-sm text-danger text-center">{error}</p>
            )}
            <Button type="submit" fullWidth isLoading={loading}>
              הירשם
            </Button>
          </form>
          )}
          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-border"></div>
            <span className="px-4 text-sm text-text-secondary">או</span>
            <div className="flex-1 border-t border-border"></div>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/catalog" })}
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

        </Card>
        <p className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-text-secondary hover:text-primary transition-colors"
          >
            חזרה לאתר
          </Link>
        </p>
      </div>
    </div>
  );
}
