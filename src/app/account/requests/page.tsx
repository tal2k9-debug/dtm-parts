"use client";

import Link from "next/link";
import Card from "@/components/ui/Card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getRequestStatusLabel, getPositionLabel, formatDate } from "@/lib/utils";

const mockRequests = [
  { id: "1", carMake: "יונדאי", carModel: "i20", carYear: "2021", position: "FRONT", status: "PENDING", createdAt: new Date(Date.now() - 86400000) },
  { id: "2", carMake: "קיה", carModel: "ספורטאז", carYear: "2022", position: "REAR", status: "QUOTED", createdAt: new Date(Date.now() - 172800000) },
];

export default function AccountRequestsPage() {
  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold text-text mb-8">הבקשות שלי</h1>
          <div className="space-y-4">
            {mockRequests.map((req) => {
              const status = getRequestStatusLabel(req.status);
              return (
                <Link key={req.id} href={`/account/requests/${req.id}`}>
                  <Card hover className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-bold text-text">{req.carMake} {req.carModel} {req.carYear}</p>
                      <p className="text-sm text-text-secondary">{getPositionLabel(req.position)} &bull; {formatDate(req.createdAt)}</p>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${status.color}`}>{status.label}</span>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}