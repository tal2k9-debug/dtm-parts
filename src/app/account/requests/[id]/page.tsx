"use client";

import { useState, useEffect, use, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getRequestStatusLabel, getPositionLabel, formatDate, formatRelativeTime } from "@/lib/utils";
import {
  TruckIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  TrashIcon,
  ArrowRightIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

interface MessageData {
  id: string;
  senderRole: string;
  content: string | null;
  imageUrl: string | null;
  createdAt: string;
  user: { id: string; name: string; role: string } | null;
}

interface RequestDetail {
  id: string;
  carMake: string;
  carModel: string;
  carYear: string;
  position: string;
  status: string;
  notes: string | null;
  imageUrl: string | null;
  quotedPrice: number | null;
  createdAt: string;
  closedAt: string | null;
  messages: MessageData[];
}

export default function AccountRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchRequest();
    }
  }, [authStatus, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [request?.messages]);

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/account/requests/${id}`);
      const data = await res.json();
      if (data.success) {
        setRequest(data.request);
      } else if (res.status === 401) {
        router.push("/login");
      } else if (res.status === 403 || res.status === 404) {
        router.push("/account/requests");
      }
    } catch (error) {
      console.error("Failed to fetch request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !request) return;
    setSendingMessage(true);
    try {
      const userId = (session?.user as Record<string, unknown> | undefined)
        ?.id as string | undefined;
      const res = await fetch(`/api/chat/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: message,
          senderRole: "customer",
          userId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRequest((prev) =>
          prev
            ? { ...prev, messages: [...prev.messages, data.message] }
            : null
        );
        setMessage("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!request) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/account/requests/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setRequest((prev) =>
          prev ? { ...prev, status: "CANCELLED" } : null
        );
        setShowConfirmCancel(false);
      } else {
        alert(data.error || "שגיאה בביטול הבקשה");
      }
    } catch (error) {
      console.error("Failed to cancel request:", error);
    } finally {
      setCancelling(false);
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

  if (!request) {
    return (
      <>
        <Header />
        <main className="pt-24 pb-16 min-h-screen bg-background flex items-center justify-center">
          <p className="text-text-secondary">הבקשה לא נמצאה</p>
        </main>
        <Footer />
      </>
    );
  }

  const statusInfo = getRequestStatusLabel(request.status);

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/account/requests"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-6"
          >
            <ArrowRightIcon className="w-4 h-4" />
            חזרה לבקשות
          </Link>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-text">
                {request.carMake} {request.carModel} {request.carYear}
              </h1>
              <p className="text-text-secondary text-sm mt-1">
                בקשה #{id.slice(0, 8)}
              </p>
            </div>
            <span
              className={`text-sm px-3 py-1.5 rounded-full font-medium ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
          </div>

          <div className="space-y-6">
            {/* Vehicle details */}
            <Card>
              <h2 className="font-bold text-text mb-4 flex items-center gap-2">
                <TruckIcon className="w-5 h-5 text-primary" />
                פרטי הרכב
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-text-secondary">יצרן</p>
                  <p className="font-medium text-text">{request.carMake}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">דגם</p>
                  <p className="font-medium text-text">{request.carModel}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">שנה</p>
                  <p className="font-medium text-text">{request.carYear}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">מיקום</p>
                  <p className="font-medium text-text">
                    {getPositionLabel(request.position)}
                  </p>
                </div>
              </div>
            </Card>

            {/* Request info */}
            <Card>
              <h2 className="font-bold text-text mb-4 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-primary" />
                פרטי הבקשה
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <CalendarIcon className="w-4 h-4 text-text-secondary mt-0.5" />
                  <div>
                    <p className="text-xs text-text-secondary">תאריך שליחה</p>
                    <p className="font-medium text-text text-sm">
                      {formatDate(request.createdAt)}
                    </p>
                  </div>
                </div>
                {request.quotedPrice != null && (
                  <div className="flex items-start gap-2">
                    <CurrencyDollarIcon className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-text-secondary">
                        הצעת מחיר
                      </p>
                      <p className="font-bold text-green-600 text-sm">
                        {"\u20AA"}{request.quotedPrice}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {request.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-text-secondary mb-1">הערות</p>
                  <p className="text-sm text-text">{request.notes}</p>
                </div>
              )}
              {request.imageUrl && (
                <div className="mt-4">
                  <p className="text-xs text-text-secondary mb-2">תמונה מצורפת</p>
                  <img
                    src={request.imageUrl}
                    alt="תמונה מצורפת לבקשה"
                    className="rounded-xl max-h-48 object-cover"
                  />
                </div>
              )}
            </Card>

            {/* Chat */}
            <Card>
              <h2 className="font-bold text-text mb-4 flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-primary" />
                שיחה עם DTM
              </h2>
              <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                {request.messages.length === 0 ? (
                  <p className="text-center text-text-secondary text-sm py-4">
                    אין הודעות עדיין. שלחו הודעה ונחזור אליכם בהקדם.
                  </p>
                ) : (
                  request.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.senderRole === "customer"
                          ? "justify-start"
                          : "justify-end"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                          msg.senderRole === "customer"
                            ? "bg-primary text-white rounded-br-md"
                            : "bg-gray-100 text-gray-800 rounded-bl-md"
                        }`}
                      >
                        {msg.content}
                        {msg.imageUrl && (
                          <img
                            src={msg.imageUrl}
                            alt="תמונה"
                            className="mt-2 rounded-lg max-h-32"
                          />
                        )}
                        <p
                          className={`text-[10px] mt-1 ${
                            msg.senderRole === "customer"
                              ? "text-white/60"
                              : "text-gray-400"
                          }`}
                        >
                          {formatRelativeTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              {request.status !== "CANCELLED" && request.status !== "CLOSED" && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !sendingMessage && handleSendMessage()
                    }
                    placeholder="כתבו הודעה..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-surface text-text"
                  />
                  <Button
                    size="sm"
                    onClick={handleSendMessage}
                    isLoading={sendingMessage}
                    icon={
                      <PaperAirplaneIcon className="w-4 h-4 rotate-180" />
                    }
                  >
                    שלח
                  </Button>
                </div>
              )}
            </Card>

            {/* Cancel button */}
            {request.status === "PENDING" && (
              <Card>
                {showConfirmCancel ? (
                  <div className="text-center space-y-3">
                    <p className="text-text font-medium">
                      האם אתם בטוחים שברצונכם לבטל את הבקשה?
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleCancelRequest}
                        isLoading={cancelling}
                        icon={<TrashIcon className="w-4 h-4" />}
                      >
                        כן, בטל בקשה
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowConfirmCancel(false)}
                      >
                        חזרה
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setShowConfirmCancel(true)}
                      icon={<TrashIcon className="w-4 h-4" />}
                    >
                      מחק בקשה
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
