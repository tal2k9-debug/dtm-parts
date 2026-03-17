"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ShoppingBagIcon, DocumentTextIcon, ChatBubbleLeftRightIcon, HeartIcon, BellIcon } from "@heroicons/react/24/outline";
import { getRequestStatusLabel, getPositionLabel, formatDate } from "@/lib/utils";
import { ADMIN_WHATSAPP_LINK } from "@/lib/constants";

interface QuoteRequest {
  id: string;
  carMake: string;
  carModel: string;
  carYear: string;
  position: string;
  status: string;
  createdAt: string;
  quotedPrice?: number;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/account/requests")
        .then((res) => res.json())
        .then((data) => {
          if (data.requests) {
            setRequests(data.requests);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingRequests(false));
    }
  }, [status]);

  if (status === "loading") {
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

  if (!session) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-text">האזור שלי</h1>
            <p className="text-text-secondary mt-1">שלום, {session.user?.name}!</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Link href="/catalog">
              <Card hover className="text-center py-8 cursor-pointer">
                <ShoppingBagIcon className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-bold text-text mb-1">קטלוג</h3>
                <p className="text-sm text-text-secondary">עיינו במלאי</p>
              </Card>
            </Link>
            <Link href="/account/favorites">
              <Card hover className="text-center py-8 cursor-pointer">
                <HeartIcon className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <h3 className="font-bold text-text mb-1">מועדפים</h3>
                <p className="text-sm text-text-secondary">הטמבונים ששמרתם</p>
              </Card>
            </Link>
            <Link href="/account/alerts">
              <Card hover className="text-center py-8 cursor-pointer">
                <BellIcon className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                <h3 className="font-bold text-text mb-1">התראות מלאי</h3>
                <p className="text-sm text-text-secondary">עדכון כשנכנס למלאי</p>
              </Card>
            </Link>
            <Link href="/quote">
              <Card hover className="text-center py-8 cursor-pointer">
                <DocumentTextIcon className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-bold text-text mb-1">בקשה חדשה</h3>
                <p className="text-sm text-text-secondary">שלח בקשת מחיר</p>
              </Card>
            </Link>
            <a href={ADMIN_WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
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
            {loadingRequests ? (
              <p className="text-text-secondary text-center py-8">טוען...</p>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-text-secondary mb-3">אין בקשות עדיין</p>
                <Link href="/quote" className="text-primary font-medium hover:underline">שלח בקשת מחיר ראשונה</Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {requests.slice(0, 5).map((req) => {
                  const statusInfo = getRequestStatusLabel(req.status);
                  return (
                    <Link key={req.id} href={`/account/requests/${req.id}`} className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-6 px-6 transition-colors">
                      <div>
                        <p className="font-medium text-text">{req.carMake} {req.carModel} {req.carYear}</p>
                        <p className="text-sm text-text-secondary">{getPositionLabel(req.position)} &bull; {formatDate(new Date(req.createdAt))}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
