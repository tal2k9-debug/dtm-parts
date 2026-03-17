"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getRequestStatusLabel, getPositionLabel, formatDate } from "@/lib/utils";

interface QuoteRequest {
  id: string;
  carMake: string;
  carModel: string;
  carYear: string;
  position: string;
  status: string;
  createdAt: string;
  notes?: string;
  quotedPrice?: number;
}

export default function AccountRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);

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
        .finally(() => setLoading(false));
    }
  }, [status]);

  if (status === "loading" || loading) {
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

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold text-text mb-8">הבקשות שלי</h1>
          {requests.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-text-secondary mb-4">אין בקשות עדיין</p>
              <Link href="/quote" className="text-primary font-medium hover:underline">
                שלח בקשת מחיר ראשונה →
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => {
                const statusInfo = getRequestStatusLabel(req.status);
                return (
                  <Link key={req.id} href={`/account/requests/${req.id}`}>
                    <Card hover className="flex items-center justify-between cursor-pointer">
                      <div>
                        <p className="font-bold text-text">{req.carMake} {req.carModel} {req.carYear}</p>
                        <p className="text-sm text-text-secondary">
                          {getPositionLabel(req.position)} &bull; {formatDate(new Date(req.createdAt))}
                        </p>
                        {req.quotedPrice && (
                          <p className="text-sm font-bold text-green-600 mt-1">₪{req.quotedPrice}</p>
                        )}
                      </div>
                      <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
