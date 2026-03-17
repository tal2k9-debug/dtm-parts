"use client";

import { useState, useEffect, useRef } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { formatRelativeTime } from "@/lib/utils";

interface Conversation {
  id: string;
  customerName: string;
  lastMessage: string;
  unread: number;
  time: string;
}

interface Message {
  id: string;
  senderRole: string;
  content: string | null;
  imageUrl: string | null;
  createdAt: string;
  user?: { id: string; name: string; role: string } | null;
}

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations (requests that have messages)
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/quotes");
      const data = await res.json();
      if (data.success && data.requests) {
        // Map requests to conversation format, prioritize those with messages
        const convs: Conversation[] = data.requests
          .filter((r: { _count: { messages: number } }) => r._count.messages > 0)
          .map((r: {
            id: string;
            user?: { name: string } | null;
            guestName?: string | null;
            carMake: string;
            carModel: string;
            createdAt: string;
            _count: { messages: number };
          }) => ({
            id: r.id,
            customerName: r.user?.name || r.guestName || "אורח",
            lastMessage: `${r.carMake} ${r.carModel} — ${r._count.messages} הודעות`,
            unread: 0,
            time: r.createdAt,
          }));
        setConversations(convs);
        if (convs.length > 0 && !selected) {
          setSelected(convs[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Fetch messages when selected conversation changes
  useEffect(() => {
    if (!selected) return;
    fetchMessages(selected);
  }, [selected]);

  const fetchMessages = async (requestId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/${requestId}`);
      const data = await res.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !selected) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chat/${selected}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: message,
          senderRole: "admin",
        }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setMessage("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeConv = conversations.find((c) => c.id === selected);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">צ׳אט</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        <Card padding="none" className="lg:col-span-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100"><h2 className="font-bold text-gray-900">שיחות</h2></div>
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <p className="text-center text-gray-400 py-8">טוען...</p>
            ) : conversations.length === 0 ? (
              <p className="text-center text-gray-400 py-8">אין שיחות פעילות</p>
            ) : (
              conversations.map((conv) => (
                <button key={conv.id} onClick={() => setSelected(conv.id)} className={`w-full text-right p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected === conv.id ? "bg-primary/5 border-r-2 border-r-primary" : ""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 text-sm">{conv.customerName}</span>
                    <span className="text-xs text-gray-400">{formatRelativeTime(conv.time)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate ml-4">{conv.lastMessage}</p>
                    {conv.unread > 0 && <span className="bg-accent text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0">{conv.unread}</span>}
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>
        <Card padding="none" className="lg:col-span-2 flex flex-col overflow-hidden">
          {activeConv ? (
            <>
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs">{activeConv.customerName.charAt(0)}</div>
                <div><p className="font-medium text-gray-900 text-sm">{activeConv.customerName}</p><a href={`/admin/requests/${activeConv.id}`} className="text-xs text-primary hover:underline">צפה בבקשה</a></div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <p className="text-center text-gray-400 py-8">טוען הודעות...</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">אין הודעות עדיין</p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.senderRole === "admin" ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${msg.senderRole === "admin" ? "bg-primary text-white rounded-br-md" : "bg-gray-100 text-gray-800 rounded-bl-md"}`}>
                        {msg.content}
                        {msg.imageUrl && (
                          <img src={msg.imageUrl} alt="תמונה" className="mt-2 rounded-lg max-w-full" />
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="כתב הודעה..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <Button size="sm" onClick={handleSend} isLoading={sending} icon={<PaperAirplaneIcon className="w-4 h-4 rotate-180" />}>שלח</Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400"><div className="text-center"><ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-3" /><p>בחר שיחה</p></div></div>
          )}
        </Card>
      </div>
    </div>
  );
}
