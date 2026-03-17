"use client";

import { useState, useEffect, use } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { getRequestStatusLabel, getPositionLabel, formatDate } from "@/lib/utils";
import { UserIcon, BuildingStorefrontIcon, StarIcon } from "@heroicons/react/24/outline";

interface CustomerDetail {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  businessName: string | null;
  businessType: string | null;
  businessId: string | null;
  businessAddress: string | null;
  role: string;
  notes: string | null;
  createdAt: string;
  lastLogin: string | null;
  requests: RequestHistory[];
}

interface RequestHistory {
  id: string;
  carMake: string;
  carModel: string;
  carYear: string;
  position: string;
  status: string;
  quotedPrice: number | null;
  createdAt: string;
}

export default function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [vipLoading, setVipLoading] = useState(false);

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/admin/customers/${id}`);
      const data = await res.json();
      if (data.success) {
        setCustomer(data.customer);
        setNotes(data.customer.notes || "");
      }
    } catch (error) {
      console.error("Failed to fetch customer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomer((prev) => prev ? { ...prev, notes } : null);
      }
    } catch (error) {
      console.error("Failed to save notes:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVIP = async () => {
    if (!customer) return;
    setVipLoading(true);
    const newRole = customer.role === "VIP" ? "CUSTOMER" : "VIP";
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomer((prev) => prev ? { ...prev, role: newRole } : null);
      }
    } catch (error) {
      console.error("Failed to toggle VIP:", error);
    } finally {
      setVipLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400 py-16">טוען...</div>;
  }

  if (!customer) {
    return <div className="text-center text-gray-400 py-16">לקוח לא נמצא</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1><p className="text-gray-500">לקוח מ- {formatDate(customer.createdAt)}</p></div>
        <Button size="sm" variant={customer.role === "VIP" ? "accent" : "secondary"} isLoading={vipLoading} onClick={handleToggleVIP} icon={<StarIcon className="w-4 h-4" />}>{customer.role === "VIP" ? "הסר VIP" : "סמן כ-VIP"}</Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><UserIcon className="w-5 h-5 text-primary" /> פרטים אישיים</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-400">שם</p><p className="font-medium">{customer.name}</p></div>
              <div><p className="text-xs text-gray-400">טלפון</p><a href={`tel:${customer.phone}`} className="font-medium text-primary">{customer.phone}</a></div>
              <div><p className="text-xs text-gray-400">אימייל</p><p className="font-medium">{customer.email || "\u2014"}</p></div>
              <div><p className="text-xs text-gray-400">סוג</p><Badge variant={customer.role === "VIP" ? "warning" : "neutral"} dot>{customer.role === "VIP" ? "VIP" : "לקוח"}</Badge></div>
            </div>
          </Card>
          <Card>
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><BuildingStorefrontIcon className="w-5 h-5 text-primary" /> פרטי עסק</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-400">שם עסק</p><p className="font-medium">{customer.businessName || "\u2014"}</p></div>
              <div><p className="text-xs text-gray-400">סוג</p><p className="font-medium">{customer.businessType === "garage" ? "מוסך" : customer.businessType === "private" ? "פרטי" : customer.businessType || "\u2014"}</p></div>
              <div><p className="text-xs text-gray-400">ח.פ.</p><p className="font-medium">{customer.businessId || "\u2014"}</p></div>
            </div>
          </Card>
          <Card>
            <h2 className="font-bold text-gray-900 mb-4">היסטוריית בקשות</h2>
            <div className="divide-y divide-gray-50">
              {customer.requests.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4">אין בקשות עדיין</p>
              ) : (
                customer.requests.map((req) => {
                  const status = getRequestStatusLabel(req.status);
                  const car = `${req.carMake} ${req.carModel} ${req.carYear}`;
                  return (
                    <a key={req.id} href={`/admin/requests/${req.id}`} className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-6 px-6 transition-colors">
                      <div><p className="font-medium text-gray-900">{car}</p><p className="text-xs text-gray-400">{getPositionLabel(req.position)} &bull; {formatDate(req.createdAt)}</p></div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>{status.label}</span>
                    </a>
                  );
                })
              )}
            </div>
          </Card>
        </div>
        <div>
          <Card>
            <h2 className="font-bold text-gray-900 mb-3">הערות פנימיות</h2>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="הוסף הערות פנימיות..." className="w-full h-32 p-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            <Button size="sm" fullWidth className="mt-3" isLoading={saving} onClick={handleSaveNotes}>שמור</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
