"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { formatRelativeTime } from "@/lib/utils";

const mockConversations = [
  { id: "r1", customerName: "יוסי כהן", lastMessage: "האם יש מחיר?", unread: 2, time: new Date(Date.now() - 300000) },
  { id: "r2", customerName: "אבי לוי", lastMessage: "תודה, אני מעוניין", unread: 0, time: new Date(Date.now() - 7200000) },
  { id: "r3", customerName: "מושיק דהן", lastMessage: "מתי הפגוש מגיע?", unread: 1, time: new Date(Date.now() - 86400000) },
];

const mockMessages = [
  { id: "m1", senderRole: "customer", content: "שלום, אני מחפש פגוש קדמי", createdAt: new Date(Date.now() - 7200000) },
  { id: "m2", senderRole: "admin", content: "היי! איזה רכב?", createdAt: new Date(Date.now() - 3600000) },
  { id: "m3", senderRole: "customer", content: "האם יש מחיר?", createdAt: new Date(Date.now() - 300000) },
];

export default function AdminChatPage() {
  const [selected, setSelected] = useState(mockConversations[0].id);
  const [message, setMessage] = useState("");
  const activeConv = mockConversations.find((c) => c.id === selected);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">צ׳אט</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        <Card padding="none" className="lg:col-span-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100"><h2 className="font-bold text-gray-900">שיחות</h2></div>
          <div className="flex-1 overflow-y-auto">
            {mockConversations.map((conv) => (
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
            ))}
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
                {mockMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderRole === "admin" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${msg.senderRole === "admin" ? "bg-primary text-white rounded-br-md" : "bg-gray-100 text-gray-800 rounded-bl-md"}`}>{msg.content}</div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="כתב הודעה..." className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <Button size="sm" icon={<PaperAirplaneIcon className="w-4 h-4 rotate-180" />}>שלח</Button>
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