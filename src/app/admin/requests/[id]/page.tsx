"use client";

import { useState, useEffect, use } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getRequestStatusLabel, getPositionLabel, formatDate } from "@/lib/utils";
import { UserIcon, PhoneIcon, TruckIcon, ChatBubbleLeftRightIcon, CurrencyDollarIcon, CheckCircleIcon, XCircleIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";

interface QuoteRequestDetail {
  id: string;
  userId: string | null;
  guestName: string | null;
  guestPhone: string | null;
  carMake: string;
  carModel: string;
  carYear: string;
  position: string;
  status: string;
  notes: string | null;
  quotedPrice: number | null;
  createdAt: string;
  user: { id: string; name: string; phone: string; email: string | null; businessName: string | null; role: string } | null;
  messages: MessageData[];
}

interface MessageData {
  id: string;
  senderRole: string;
  content: string | null;
  imageUrl: string | null;
  createdAt: string;
  user: { id: string; name: string; role: string } | null;
}

export default function AdminRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [quotePrice, setQuotePrice] = useState("");
  const [message, setMessage] = useState("");
  const [request, setRequest] = useState<QuoteRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/quotes/${id}`);
      const data = await res.json();
      if (data.success) {
        setRequest(data.request);
      }
    } catch (error) {
      console.error("Failed to fetch request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendQuote = async () => {
    if (!quotePrice || !request) return;
    setActionLoading("quote");
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotedPrice: parseFloat(quotePrice), status: "QUOTED" }),
      });
      const data = await res.json();
      if (data.success) {
        setRequest((prev) => prev ? { ...prev, status: "QUOTED", quotedPrice: parseFloat(quotePrice) } : null);
        setQuotePrice("");
      }
    } catch (error) {
      console.error("Failed to send quote:", error);
    } finally {
      setActionLoading("");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!request) return;
    setActionLoading(newStatus);
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setRequest((prev) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setActionLoading("");
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !request) return;
    try {
      const res = await fetch(`/api/chat/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message, senderRole: "admin" }),
      });
      const data = await res.json();
      if (data.success) {
        setRequest((prev) => prev ? { ...prev, messages: [...prev.messages, data.message] } : null);
        setMessage("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400 py-16">טוען...</div>;
  }

  if (!request) {
    return <div className="text-center text-gray-400 py-16">הבקשה לא נמצאה</div>;
  }

  const status = getRequestStatusLabel(request.status);
  const name = request.user?.name || request.guestName || "אורח";
  const phone = request.user?.phone || request.guestPhone || "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">בקשה #{id.slice(0, 8)}</h1><p className="text-gray-500">{formatDate(request.createdAt)}</p></div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${status.color}`}>{status.label}</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><UserIcon className="w-5 h-5 text-primary" /> פרטי לקוח</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-400">שם</p><p className="font-medium">{name}</p></div>
              <div><p className="text-xs text-gray-400">טלפון</p>{phone ? <a href={`tel:${phone}`} className="font-medium text-primary">{phone}</a> : <p className="font-medium">{"\u2014"}</p>}</div>
            </div>
          </Card>
          <Card>
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><TruckIcon className="w-5 h-5 text-primary" /> פרטי רכב</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div><p className="text-xs text-gray-400">יצרן</p><p className="font-medium">{request.carMake}</p></div>
              <div><p className="text-xs text-gray-400">דגם</p><p className="font-medium">{request.carModel}</p></div>
              <div><p className="text-xs text-gray-400">שנה</p><p className="font-medium">{request.carYear}</p></div>
              <div><p className="text-xs text-gray-400">מיקום</p><p className="font-medium">{getPositionLabel(request.position)}</p></div>
            </div>
            {request.notes && <div className="mt-4 p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-400 mb-1">הערות</p><p className="text-sm text-gray-700">{request.notes}</p></div>}
          </Card>
          <Card>
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><ChatBubbleLeftRightIcon className="w-5 h-5 text-primary" /> שיחה</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
              {request.messages.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4">אין הודעות עדיין</p>
              ) : (
                request.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderRole === "admin" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${msg.senderRole === "admin" ? "bg-primary text-white rounded-br-md" : "bg-gray-100 text-gray-800 rounded-bl-md"}`}>{msg.content}</div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} placeholder="כתב הודעה..." className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <Button size="sm" onClick={handleSendMessage} icon={<PaperAirplaneIcon className="w-4 h-4 rotate-180" />}>שלח</Button>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><CurrencyDollarIcon className="w-5 h-5 text-primary" /> פעולות</h2>
            <div className="space-y-3">
              <Input label="הצעת מחיר (₪)" value={quotePrice} onChange={(e) => setQuotePrice(e.target.value)} placeholder="0" type="number" />
              <Button fullWidth variant="primary" onClick={handleSendQuote} isLoading={actionLoading === "quote"} icon={<CurrencyDollarIcon className="w-4 h-4" />}>שלח הצעת מחיר</Button>
              <Button fullWidth variant="secondary" onClick={() => handleStatusChange("CLOSED")} isLoading={actionLoading === "CLOSED"} icon={<CheckCircleIcon className="w-4 h-4" />}>סגור בקשה</Button>
              <Button fullWidth variant="danger" onClick={() => handleStatusChange("CANCELLED")} isLoading={actionLoading === "CANCELLED"} icon={<XCircleIcon className="w-4 h-4" />}>בטל בקשה</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
