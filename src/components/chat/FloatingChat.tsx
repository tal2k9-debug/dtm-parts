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
  PlusCircleIcon,
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
  user?: { id: string; name: string; role: string } | null;
}

type ChatMode = "list" | "request" | "general";

export default function FloatingChat() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>("list");
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
  if (pathname?.startsWith("/admin")) return null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchRequests = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoadingRequests(true);
    try {
      const res = await fetch("/api/account/requests");
      const data = await res.json();
      if (data.requests) setRequests(data.requests);
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  }, [isLoggedIn]);

  const fetchMessages = useCallback(async (requestId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/${requestId}`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const fetchGeneralMessages = useCallback(async () => {
    setLoadingMessages(true);
    try {
      const res = await fetch("/api/chat/general");
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch (err) {
      console.error("Failed to load general messages:", err);
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
      if (data.requests?.length > 0) {
        for (const req of data.requests) {
          const msgRes = await fetch(`/api/chat/${req.id}`);
          const msgData = await msgRes.json();
          if (msgData.messages?.some((m: ChatMessage) => m.senderRole === "admin" && !m.readAt)) {
            setHasUnread(true);
            return;
          }
        }
      }
      // Also check general chat
      const genRes = await fetch("/api/chat/general");
      const genData = await genRes.json();
      if (genData.messages?.some((m: ChatMessage) => m.senderRole === "admin" && !m.readAt)) {
        setHasUnread(true);
        return;
      }
      setHasUnread(false);
    } catch { /* ignore */ }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isOpen && isLoggedIn) fetchRequests();
  }, [isOpen, isLoggedIn, fetchRequests]);

  useEffect(() => {
    if (mode === "request" && selectedRequest) fetchMessages(selectedRequest);
    else if (mode === "general") fetchGeneralMessages();
  }, [mode, selectedRequest, fetchMessages, fetchGeneralMessages]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (status === "authenticated") {
      checkUnread();
      const interval = setInterval(checkUnread, 30000);
      return () => clearInterval(interval);
    }
  }, [status, checkUnread]);

  // Poll messages when conversation is open
  useEffect(() => {
    if (!isOpen) return;
    if (mode === "request" && selectedRequest) {
      const interval = setInterval(() => fetchMessages(selectedRequest), 5000);
      return () => clearInterval(interval);
    }
    if (mode === "general") {
      const interval = setInterval(fetchGeneralMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [mode, selectedRequest, isOpen, fetchMessages, fetchGeneralMessages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      let url: string;
      let body: Record<string, unknown>;

      if (mode === "general") {
        url = "/api/chat/general";
        body = { content: messageContent };
      } else if (mode === "request" && selectedRequest) {
        url = `/api/chat/${selectedRequest}`;
        body = { content: messageContent, senderRole: "customer", userId };
      } else {
        return;
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setNewMessage(messageContent);
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

  const goBack = () => {
    setMode("list");
    setSelectedRequest(null);
    setMessages([]);
  };

  const openGeneralChat = () => {
    setMode("general");
    setSelectedRequest(null);
  };

  const openRequestChat = (requestId: string) => {
    setSelectedRequest(requestId);
    setMode("request");
  };

  const getPositionLabel = (pos: string) => pos === "FRONT" ? "קדמי" : "אחורי";
  const getStatusLabel = (s: string) => {
    switch (s) {
      case "PENDING": return "ממתין";
      case "QUOTED": return "הצעת מחיר";
      case "CLOSED": return "סגור";
      case "CANCELLED": return "בוטל";
      default: return s;
    }
  };
  const formatTime = (d: string) => new Date(d).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  const formatDate = (d: string) => new Date(d).toLocaleDateString("he-IL", { day: "numeric", month: "short" });

  const isInConversation = mode === "request" || mode === "general";

  // ── Messages View (shared between request and general chat) ──
  const renderMessages = () => (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loadingMessages ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-text-secondary text-sm">טוען הודעות...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <p className="text-text-secondary text-sm mb-1">אין הודעות עדיין</p>
            <p className="text-text-secondary text-xs">שלח הודעה ונחזור אליך בהקדם</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isCustomer = msg.senderRole === "customer";
              return (
                <div key={msg.id} className={cn("flex", isCustomer ? "justify-start" : "justify-end")}>
                  <div className={cn(
                    "max-w-[80%] px-3 py-2 rounded-2xl text-sm",
                    isCustomer ? "bg-accent text-white rounded-br-sm" : "bg-gray-100 text-text rounded-bl-sm"
                  )}>
                    {!isCustomer && <p className="text-xs font-bold text-primary mb-1">DTM</p>}
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={cn("text-[10px] mt-1", isCustomer ? "text-white/70" : "text-gray-400")}>
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
              newMessage.trim() && !sending ? "bg-accent text-white hover:bg-accent/90" : "bg-gray-100 text-gray-400"
            )}
          >
            <PaperAirplaneIcon className="w-5 h-5 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Chat Bubble Button */}
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) setHasUnread(false); }}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg",
          "flex items-center justify-center transition-all duration-300",
          "hover:scale-110 active:scale-95",
          isOpen ? "bg-gray-600 rotate-0" : "bg-accent hover:bg-accent/90"
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
          "bottom-24 right-6 w-[350px] h-[500px] rounded-2xl",
          "max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:top-0 max-sm:w-full max-sm:h-full max-sm:rounded-none",
          isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <div className="bg-white h-full flex flex-col shadow-2xl rounded-2xl max-sm:rounded-none overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-primary text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {isInConversation && (
                <button onClick={goBack} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              )}
              <ChatSolid className="w-5 h-5" />
              <h3 className="font-bold text-sm">
                {mode === "general" ? "שיחה חופשית" : mode === "request" ? "שיחה על הבקשה" : "צ'אט עם DTM"}
              </h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden">
            {!isLoggedIn ? (
              /* Not logged in */
              <div className="h-full flex flex-col items-center justify-center px-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ChatBubbleLeftRightIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-text font-bold mb-2">התחבר כדי לשלוח הודעות</p>
                <p className="text-text-secondary text-sm mb-6">עליך להתחבר לחשבון כדי לשוחח עם הצוות שלנו</p>
                <button
                  onClick={() => { setIsOpen(false); router.push("/login"); }}
                  className="bg-accent text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors w-full"
                >
                  התחברות
                </button>
                <button
                  onClick={() => { setIsOpen(false); router.push("/register"); }}
                  className="mt-2 text-primary text-sm font-medium hover:underline"
                >
                  אין לך חשבון? הירשם עכשיו
                </button>
              </div>
            ) : isInConversation ? (
              renderMessages()
            ) : (
              /* Conversation List */
              <div className="h-full overflow-y-auto">
                {loadingRequests ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-text-secondary text-sm">טוען...</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {/* Free conversation button — always first */}
                    <button
                      onClick={openGeneralChat}
                      className="w-full px-4 py-4 hover:bg-accent/5 transition-colors text-right flex items-center gap-3"
                    >
                      <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
                        <PlusCircleIcon className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-text">שיחה חופשית</p>
                        <p className="text-xs text-text-secondary">שאלו אותנו כל דבר, בלי בקשה פתוחה</p>
                      </div>
                    </button>

                    {/* Existing requests */}
                    {requests.length > 0 && (
                      <div className="px-4 py-2 bg-gray-50">
                        <p className="text-xs font-bold text-text-secondary">הבקשות שלי</p>
                      </div>
                    )}
                    {requests.map((req) => (
                      <button
                        key={req.id}
                        onClick={() => openRequestChat(req.id)}
                        className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-right"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-secondary">{formatDate(req.createdAt)}</span>
                          <p className="font-bold text-sm text-text">
                            {req.carMake} {req.carModel} {req.carYear}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <ChevronRightIcon className="w-4 h-4 text-gray-400 rotate-180" />
                          <p className="text-xs text-text-secondary">
                            {getPositionLabel(req.position)} &bull; {getStatusLabel(req.status)}
                          </p>
                        </div>
                      </button>
                    ))}

                    {requests.length === 0 && (
                      <div className="px-6 py-6 text-center">
                        <p className="text-text-secondary text-sm">אין בקשות פתוחות</p>
                        <button
                          onClick={() => { setIsOpen(false); router.push("/quote"); }}
                          className="mt-3 text-primary text-sm font-medium hover:underline"
                        >
                          שלח בקשת מחיר
                        </button>
                      </div>
                    )}
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
