"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
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

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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

      // Registration successful - redirect to login
      router.push("/login?registered=true");
    } catch {
      setError("שגיאה בהרשמה, נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <Image
              src="/images/logo.jpeg"
              alt={SITE_NAME}
              width={64}
              height={64}
              className="rounded-full mx-auto"
            />
          </Link>
          <h1 className="text-2xl font-bold text-text">הרשמה</h1>
          <p className="text-text-secondary mt-1">צור חשבון חדש ב-DTM PARTS</p>
        </div>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="border-t border-border pt-4 mt-4">
              <p className="text-sm text-text-secondary mb-3">
                פרטים נוספים (לא חובה)
              </p>
            </div>

            <Input
              label="אימייל"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="email@example.com"
              icon={<EnvelopeIcon className="w-5 h-5" />}
            />
            <Input
              label="שם עסק"
              value={form.businessName}
              onChange={(e) => updateField("businessName", e.target.value)}
              placeholder="שם העסק"
              icon={<BuildingStorefrontIcon className="w-5 h-5" />}
            />
            <Input
              label="כתובת עסק"
              value={form.businessAddress}
              onChange={(e) => updateField("businessAddress", e.target.value)}
              placeholder="כתובת העסק"
              icon={<MapPinIcon className="w-5 h-5" />}
            />
            <Input
              label='ח.פ.'
              value={form.businessId}
              onChange={(e) => updateField("businessId", e.target.value)}
              placeholder="מספר חברה / עוסק"
              icon={<IdentificationIcon className="w-5 h-5" />}
            />
            <Select
              label="סוג לקוח"
              value={form.businessType}
              onChange={(e) => updateField("businessType", e.target.value)}
              placeholder="בחר סוג"
              options={[
                { value: "garage", label: "מוסך" },
                { value: "private", label: "פרטי" },
                { value: "other", label: "אחר" },
              ]}
            />

            {error && (
              <p className="text-sm text-danger text-center">{error}</p>
            )}
            <Button type="submit" fullWidth isLoading={loading}>
              הירשם
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              כבר יש לך חשבון?{" "}
              <Link
                href="/login"
                className="text-primary font-medium hover:underline"
              >
                התחבר
              </Link>
            </p>
          </div>
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
