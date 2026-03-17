"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getPositionLabel } from "@/lib/utils";
import {
  BellIcon,
  PlusIcon,
  TrashIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";

interface StockAlert {
  id: string;
  carMake: string;
  carModel: string;
  carYear: string | null;
  position: string | null;
  active: boolean;
  createdAt: string;
}

interface BumperData {
  carMake: string;
  carModel: string;
  carYear: string;
}

export default function AlertsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [carMake, setCarMake] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carYear, setCarYear] = useState("");
  const [position, setPosition] = useState("");

  // Dropdown options
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [bumpers, setBumpers] = useState<BumperData[]>([]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchAlerts();
      fetchBumperData();
    }
  }, [authStatus]);

  // Derive makes/models/years from bumper data
  useEffect(() => {
    const uniqueMakes = [...new Set(bumpers.map((b) => b.carMake))].sort();
    setMakes(uniqueMakes);
  }, [bumpers]);

  useEffect(() => {
    if (carMake) {
      const filteredModels = [
        ...new Set(
          bumpers.filter((b) => b.carMake === carMake).map((b) => b.carModel)
        ),
      ].sort();
      setModels(filteredModels);
      setCarModel("");
      setCarYear("");
    } else {
      setModels([]);
      setCarModel("");
      setCarYear("");
    }
  }, [carMake, bumpers]);

  useEffect(() => {
    if (carMake && carModel) {
      const filteredYears = [
        ...new Set(
          bumpers
            .filter((b) => b.carMake === carMake && b.carModel === carModel)
            .map((b) => b.carYear)
        ),
      ].sort();
      setYears(filteredYears);
      setCarYear("");
    } else {
      setYears([]);
      setCarYear("");
    }
  }, [carModel, carMake, bumpers]);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/account/alerts");
      const data = await res.json();
      if (data.success) {
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBumperData = async () => {
    try {
      const res = await fetch("/api/bumpers?limit=500");
      const data = await res.json();
      if (data.bumpers) {
        setBumpers(
          data.bumpers.map((b: BumperData) => ({
            carMake: b.carMake,
            carModel: b.carModel,
            carYear: b.carYear,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch bumper data:", error);
    }
  };

  const handleCreateAlert = async () => {
    if (!carMake || !carModel) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/account/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carMake,
          carModel,
          carYear: carYear || undefined,
          position: position || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAlerts((prev) => [data.alert, ...prev]);
        setCarMake("");
        setCarModel("");
        setCarYear("");
        setPosition("");
        setShowForm(false);
      }
    } catch (error) {
      console.error("Failed to create alert:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    setDeletingId(alertId);
    try {
      const res = await fetch("/api/account/alerts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: alertId }),
      });
      const data = await res.json();
      if (data.success) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      }
    } catch (error) {
      console.error("Failed to delete alert:", error);
    } finally {
      setDeletingId(null);
    }
  };

  if (authStatus === "loading" || loading) {
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

  if (!session) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-text">
                התראות מלאי
              </h1>
              <p className="text-text-secondary mt-1">
                קבלו התראה כשטמבון שאתם מחפשים נכנס למלאי
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowForm(!showForm)}
              icon={<PlusIcon className="w-4 h-4" />}
            >
              התראה חדשה
            </Button>
          </div>

          {/* New alert form */}
          {showForm && (
            <Card className="mb-6">
              <h2 className="font-bold text-text mb-4 flex items-center gap-2">
                <BellIcon className="w-5 h-5 text-primary" />
                הוספת התראה חדשה
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    יצרן *
                  </label>
                  <select
                    value={carMake}
                    onChange={(e) => setCarMake(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    <option value="">בחרו יצרן</option>
                    {makes.map((make) => (
                      <option key={make} value={make}>
                        {make}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    דגם *
                  </label>
                  <select
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    disabled={!carMake}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50"
                  >
                    <option value="">בחרו דגם</option>
                    {models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    שנה (אופציונלי)
                  </label>
                  <select
                    value={carYear}
                    onChange={(e) => setCarYear(e.target.value)}
                    disabled={!carModel}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50"
                  >
                    <option value="">כל השנים</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    מיקום (אופציונלי)
                  </label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    <option value="">קדמי + אחורי</option>
                    <option value="FRONT">קדמי</option>
                    <option value="REAR">אחורי</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleCreateAlert}
                  isLoading={submitting}
                  disabled={!carMake || !carModel}
                  icon={<BellIcon className="w-4 h-4" />}
                >
                  הוסף התראה
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowForm(false);
                    setCarMake("");
                    setCarModel("");
                    setCarYear("");
                    setPosition("");
                  }}
                >
                  ביטול
                </Button>
              </div>
            </Card>
          )}

          {/* Alerts list */}
          {alerts.length === 0 ? (
            <Card className="text-center py-12">
              <BellIcon className="w-12 h-12 text-text-secondary mx-auto mb-3" />
              <p className="text-text-secondary mb-4">
                אין התראות פעילות
              </p>
              <p className="text-sm text-text-secondary mb-4">
                הוסיפו התראה כדי לקבל עדכון כשטמבון שאתם מחפשים נכנס למלאי
              </p>
              {!showForm && (
                <Button
                  size="sm"
                  onClick={() => setShowForm(true)}
                  icon={<PlusIcon className="w-4 h-4" />}
                >
                  הוסף התראה ראשונה
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Card
                  key={alert.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <TruckIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-text">
                        {alert.carMake} {alert.carModel}
                        {alert.carYear ? ` ${alert.carYear}` : ""}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {alert.position
                          ? getPositionLabel(alert.position)
                          : "קדמי + אחורי"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAlert(alert.id)}
                    isLoading={deletingId === alert.id}
                    icon={<TrashIcon className="w-4 h-4 text-red-500" />}
                  >
                    הסר
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
