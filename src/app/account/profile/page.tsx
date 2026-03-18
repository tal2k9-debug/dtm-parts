"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { ArrowRightIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface UserProfile {
  name: string;
  phone: string;
  email: string;
  businessName: string;
  businessAddress: string;
  businessId: string;
  businessType: string;
}

export default function ProfilePage() {
  const { status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    phone: "",
    email: "",
    businessName: "",
    businessAddress: "",
    businessId: "",
    businessType: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/account/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setProfile({
              name: data.user.name || "",
              phone: data.user.phone || "",
              email: data.user.email || "",
              businessName: data.user.businessName || "",
              businessAddress: data.user.businessAddress || "",
              businessId: data.user.businessId || "",
              businessType: data.user.businessType || "",
            });
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "שגיאה בעדכון");
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError("שגיאה בעדכון הפרטים");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <>
        <Header />
        <main className="pt-24 pb-16 min-h-screen bg-background flex items-center justify-center">
          <p className="text-text-secondary">טוען...</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="mb-6">
            <Link href="/account" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-4">
              <ArrowRightIcon className="w-4 h-4" />
              חזרה לאזור האישי
            </Link>
            <h1 className="text-3xl font-extrabold text-text">עריכת פרטים</h1>
            <p className="text-text-secondary mt-1">עדכנו את הפרטים האישיים והעסקיים שלכם</p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Details */}
              <div>
                <h2 className="font-bold text-lg text-text mb-4">פרטים אישיים</h2>
                <div className="space-y-4">
                  <Input
                    label="שם מלא *"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    required
                  />
                  <Input
                    label="טלפון *"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    required
                    dir="ltr"
                  />
                  <Input
                    label="אימייל"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Business Details */}
              <div className="border-t border-border pt-6">
                <h2 className="font-bold text-lg text-text mb-4">פרטי עסק (אופציונלי)</h2>
                <div className="space-y-4">
                  <Input
                    label="שם העסק"
                    value={profile.businessName}
                    onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                  />
                  <Input
                    label="כתובת העסק"
                    value={profile.businessAddress}
                    onChange={(e) => setProfile({ ...profile, businessAddress: e.target.value })}
                  />
                  <Input
                    label="ח.פ. / עוסק מורשה"
                    value={profile.businessId}
                    onChange={(e) => setProfile({ ...profile, businessId: e.target.value })}
                    dir="ltr"
                  />
                  <div>
                    <label className="block text-sm font-medium text-text mb-1">סוג עסק</label>
                    <select
                      value={profile.businessType}
                      onChange={(e) => setProfile({ ...profile, businessType: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-border bg-white text-text focus:border-primary focus:outline-none transition-colors"
                    >
                      <option value="">בחר סוג</option>
                      <option value="garage">מוסך</option>
                      <option value="private">פרטי</option>
                      <option value="dealer">סוחר</option>
                      <option value="other">אחר</option>
                    </select>
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-danger text-center">{error}</p>}

              {success && (
                <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 py-3 rounded-xl">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span className="font-medium">הפרטים עודכנו בהצלחה!</span>
                </div>
              )}

              <Button type="submit" fullWidth isLoading={saving}>
                שמור שינויים
              </Button>
            </form>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
