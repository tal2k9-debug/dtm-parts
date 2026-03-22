"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { MagnifyingGlassIcon, EyeIcon, PhoneIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

interface Customer {
  id: string;
  name: string;
  username: string;
  phone: string;
  email: string | null;
  businessName: string | null;
  businessType: string | null;
  businessId: string | null;
  businessAddress: string | null;
  role: string;
  createdAt: string;
  lastLogin: string | null;
  _count: { requests: number };
}

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(s) ||
      c.phone.includes(s) ||
      (c.email && c.email.toLowerCase().includes(s)) ||
      (c.username && c.username.toLowerCase().includes(s)) ||
      (c.businessName && c.businessName.includes(s))
    );
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">לקוחות</h1>
        <p className="text-gray-500 mt-1">{filtered.length} לקוחות רשומים</p>
      </div>
      <Card>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="חיפוש לקוח..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
      </Card>
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-right py-3 px-4 font-medium text-gray-500">שם</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">שם משתמש</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">טלפון</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">מייל</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">עסק</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">ח.פ.</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">סוג</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">הצטרף</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">כניסה אחרונה</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">בקשות</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={11} className="text-center py-8 text-gray-400">טוען...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-8 text-gray-400">אין לקוחות</td></tr>
              ) : (
                filtered.map((cust) => (
                  <tr key={cust.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs">{cust.name.charAt(0)}</div>
                        <span className="font-medium text-gray-900">{cust.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{cust.username}</td>
                    <td className="py-3 px-4 text-gray-600">{cust.phone || "—"}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{cust.email || "—"}</td>
                    <td className="py-3 px-4 text-gray-600">{cust.businessName || "—"}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{cust.businessId || "—"}</td>
                    <td className="py-3 px-4">
                      <Badge variant={cust.role === "VIP" ? "warning" : cust.role === "ADMIN" ? "danger" : "neutral"} dot>
                        {cust.role === "VIP" ? "VIP" : cust.role === "ADMIN" ? "מנהל" : "לקוח"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(cust.createdAt)}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(cust.lastLogin)}</td>
                    <td className="py-3 px-4 text-gray-600">{cust._count.requests}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <a href={`/admin/customers/${cust.id}`} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"><EyeIcon className="w-4 h-4" /></a>
                        {cust.phone && <a href={`tel:${cust.phone}`} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"><PhoneIcon className="w-4 h-4" /></a>}
                        {cust.email && <a href={`mailto:${cust.email}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><EnvelopeIcon className="w-4 h-4" /></a>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
