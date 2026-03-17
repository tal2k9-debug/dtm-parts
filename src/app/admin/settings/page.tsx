"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { DevicePhoneMobileIcon, ClockIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

export default function AdminSettingsPage() {
  const [whatsappNumber, setWhatsappNumber] = useState("+972501234567");
  const [responseTime, setResponseTime] = useState("מענה תוך 2 שעות");
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 3000); };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">הגדרות</h1><p className="text-gray-500 mt-1">נהל את הגדרות המערכת</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><DevicePhoneMobileIcon className="w-5 h-5 text-primary" /> התראות וואטסאפ</h2>
          <div className="space-y-4">
            <Input label="מספר וואטסאפ להתראות" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="+972..." />
            <p className="text-xs text-gray-400">כל בקשה חדשה והודעה חדשה ישלחו למספר הזה</p>
          </div>
        </Card>
        <Card>
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><ClockIcon className="w-5 h-5 text-primary" /> זמן תגובה</h2>
          <div className="space-y-4">
            <Input label="טקסט זמן תגובה" value={responseTime} onChange={(e) => setResponseTime(e.target.value)} placeholder="מענה תוך..." />
            <p className="text-xs text-gray-400">מוצג ללקוחות לאחר שליחת בקשה</p>
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><DocumentTextIcon className="w-5 h-5 text-primary" /> תבניות הודעות</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">הודעת בקשה חדשה</label>
              <textarea defaultValue="בקשה חדשה התקבלה! נחזור אליך עם הצעת מחיר בהקדם." className="w-full h-24 p-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">הודעת הצעת מחיר</label>
              <textarea defaultValue={"קיבלת הצעת מחיר מ-DTM PARTS! המחיר המוצע לך: {price}"} className="w-full h-24 p-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
          </div>
        </Card>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} variant={saved ? "secondary" : "primary"}>{saved ? "נשמר בהצלחה!" : "שמור הגדרות"}</Button>
      </div>
    </div>
  );
}