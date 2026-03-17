"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { ChatBubbleLeftRightIcon as ChatSolid } from "@heroicons/react/24/solid";

interface QuoteRequest {
  id: string;
  carMake: string;
  carModel: string;
  carYear: string;
  position: string;
  status: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  content: string | null;
  senderRole: string;
  createdAt: string;
  readAt: string | null;
  user?: {
    id: string;
    name: string;
    role: string;
  } | null;
}

export default function FloatingChat() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoggedIn = !!session?.user;
  const userId = (session?.user as Record<string, unknown> | undefined)?.id as string | undefined;

  // Hide on admin pages
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch user's requests when panel opens
  const fetchRequests = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoadingRequests(true);
    try {
      const res = await fetch("/api/account/requests");
      const data = await res.json();
      if (data.requests) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  }, [isLoggedIn]);

  // Fetch messages for a specific request
  const fetchMessages = useCallback(async (requestId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/${requestId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Check for unread messages
  const checkUnread = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await fetch("/api/account/requests");
      const data = await res.json();
      if (data.requests && data.requests.length > 0) {
        // Check each request for unread admin messages
        for (const req of data.requests) {
          const msgRes = await fetch(`/api/chat/${req.id}`);
          const msgData = await msgRes.json();
          if (msgData.messages) {
            const unread = msgData.messages.some(
              (m: ChatMessage) => m.senderRole === "admin" && !m.readAt
            );
            if (unread) {
              setHasUnread(true);
              return;
            }
          }
        }
        setHasUnread(false);
      }
    } catch {
      // Silently ignore
    }
  }, [isLoggedIn]);

  // Load requests when chat opens
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      fetchRequests();
    }
  }, [isOpen, isLoggedIn, fetchRequests]);

  // Load messages when selecting a request
  useEffect(() => {
    if (selectedRequest) {
      fetchMessages(selectedRequest);
    }
  }, [selectedRequest, fetchMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll for unread on mount (only if logged in)
  useEffect(() => {
    if (status === "authenticated") {
      checkUnread();
      const interval = setInterval(checkUnread, 30000);
      return () => clearInterval(interval);
    }
  }, [status, checkUnread]);

  // Poll messages when a conversation is open
  useEffect(() => {
    if (selectedRequest && isOpen) {
      const interval = setInterval(() => {
        fetchMessages(selectedRequest);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedRequest, isOpen, fetchMessages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedRequest || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const res = await fetch(`/api/chat/${selectedRequest}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageContent,
          senderRole: "customer",
          userId: userId,
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getPositionLabel = (pos: string) =>
    pos === "FRONT" ? "קדמי" : "אחורי";

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "ממתין";
      case "QUOTED":
        return "הצעת מחיר";
      case "CLOSED":
        return "סגור";
      case "CANCELLED":
        return "בוטל";
      default:
        return status;
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("he-IL", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <>
      {/* Chat Bubble Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setHasUnread(false);
        }}
        className={cn(
          "fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full shadow-lg",
          "flex items-center justify-center transition-all duration-300",
          "hover:scale-110 active:scale-95",
          isOpen
            ? "bg-gray-600 rotate-0"
            : "bg-accent hover:bg-accent/90"
        )}
        aria-label={isOpen ? "סגור צ'אט" : "פתח צ'אט"}
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6 text-white" />
        ) : (
          <>
            <ChatBubbleLeftRightIcon className="w-7 h-7 text-white" />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </>
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={cn(
          "fixed z-50 transition-all duration-300 ease-in-out",
          // Desktop positioning
          "bottom-24 left-6 w-[350px] h-[500px] rounded-2xl",
          // Mobile: full screen
          "max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:top-0 max-sm:w-full max-sm:h-full max-sm:rounded-none",
          // Visibility
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <div className="bg-white h-full flex flex-col shadow-2xl rounded-2xl max-sm:rounded-none overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-primary text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {selectedRequest && (
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setMessages([]);
                  }}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              )}
              <ChatSolid className="w-5 h-5" />
              <h3 className="font-bold text-sm">
                {selectedRequest ? "שיחה עם DTM" : "צ'אט עם DTM"}
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden">
            {!isLoggedIn ? (
              /* Not logged in state */
              <div className="h-full flex flex-col items-center justify-center px-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ChatBubbleLeftRightIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-text font-bold mb-2">התחבר כדי לשלוח הודעות</p>
                <p className="text-text-secondary text-sm mb-6">
                  עליך להתחבר לחשבון כדי לשוחח עם הצוות שלנו
                </p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/login");
                  }}
                  className="bg-accent text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors w-full"
                >
                  התחברות
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/register");
                  }}
                  className="mt-2 text-primary text-sm font-medium hover:underline"
                >
                  אין לך חשבון? הירשם עכשיו
                </button>
              </div>
            ) : selectedRequest ? (
              /* Messages view */
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {loadingMessages ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-text-secondary text-sm">טוען הודעות...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <p className="text-text-secondary text-sm mb-1">
                        אין הודעות עדיין
                      </p>
                      <p className="text-text-secondary text-xs">
                        שלח הודעה ונחזור אליך בהקדם
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => {
                        const isCustomer = msg.senderRole === "customer";
                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex",
                              isCustomer ? "justify-start" : "justify-end"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[80%] px-3 py-2 rounded-2xl text-sm",
                                isCustomer
                                  ? "bg-accent text-white rounded-br-sm"
                                  : "bg-gray-100 text-text rounded-bl-sm"
                              )}
                            >
                              {!isCustomer && (
                                <p className="text-xs font-bold text-primary mb-1">
                                  DTM
                                </p>
                              )}
                              <p className="whitespace-pre-wrap break-words">
                                {msg.content}
                              </p>
                              <p
                                className={cn(
                                  "text-[10px] mt-1",
                                  isCustomer
                                    ? "text-white/70"
                                    : "text-gray-400"
                                )}
                              >
                                {formatTime(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input */}
                <div className="border-t border-gray-200 px-3 py-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="כתוב הודעה..."
                      className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-accent/30 border border-gray-200"
                      disabled={sending}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || sending}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0",
                        newMessage.trim() && !sending
                          ? "bg-accent text-white hover:bg-accent/90"
                          : "bg-gray-100 text-gray-400"
                      )}
                    >
                      <PaperAirplaneIcon className="w-5 h-5 rotate-180" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Request list view */
              <div className="h-full overflow-y-auto">
                {loadingRequests ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-text-secondary text-sm">טוען...</p>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center px-6 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <ChatBubbleLeftRightIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-text font-bold mb-2">אין בקשות פעילות</p>
                    <p className="text-text-secondary text-sm mb-6">
                      שלח בקשת מחיר כדי להתחיל שיחה
                    </p>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        router.push("/quote");
                      }}
                      className="bg-accent text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors w-full"
                    >
                      שלח בקשת מחיר
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {requests.map((req) => (
                      <button
                        key={req.id}
                        onClick={() => setSelectedRequest(req.id)}
                        className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-right"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-secondary">
                            {formatDate(req.createdAt)}
                          </span>
                          <p className="font-bold text-sm text-text">
                            {req.carMake} {req.carModel} {req.carYear}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <ChevronRightIcon className="w-4 h-4 text-gray-400 rotate-180" />
                          <p className="text-xs text-text-secondary">
                            {getPositionLabel(req.position)} &bull;{" "}
                            {getStatusLabel(req.status)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
