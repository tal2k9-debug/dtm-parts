"use client";

import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ShoppingBagIcon, DocumentTextIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

export default function AccountPage() {
  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-text">האזור שלי</h1>
            <p className="text-text-secondary mt-1">שלום, יוסי!</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Link href="/catalog">
              <Card hover className="text-center py-8 cursor-pointer">
                <ShoppingBagIcon className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-bold text-text mb-1">קטלוג</h3>
                <p className="text-sm text-text-secondary">עיינו במלאי</p>
              </Card>
            </Link>
            <Link href="/quote">
              <Card hover className="text-center py-8 cursor-pointer">
                <DocumentTextIcon className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-bold text-text mb-1">בקשה חדשה</h3>
                <p className="text-sm text-text-secondary">שלח בקשת מחיר</p>
              </Card>
            </Link>
            <a href="https://wa.me/972501234567" target="_blank">
              <Card hover className="text-center py-8 cursor-pointer">
                <ChatBubbleLeftRightIcon className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <h3 className="font-bold text-text mb-1">וואטסאפ</h3>
                <p className="text-sm text-text-secondary">דברו איתנו ישירות</p>
              </Card>
            </a>
          </div>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-text">הבקשות שלי</h2>
              <Link href="/account/requests" className="text-sm text-primary hover:underline">הצג הכל</Link>
            </div>
            <p className="text-text-secondary text-center py-8">אין בקשות עדיין</p>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}