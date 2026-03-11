import { Suspense } from "react";
import QuoteContent from "./QuoteContent";

export default function QuotePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <QuoteContent />
    </Suspense>
  );
}
