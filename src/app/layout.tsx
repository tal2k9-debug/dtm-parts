import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import Providers from "./Providers";
import FloatingChat from "@/components/chat/FloatingChat";
import ErrorBoundary from "@/components/ErrorBoundary";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import CookieBanner from "@/components/CookieBanner";
import AccessibilityWidget from "@/components/AccessibilityWidget";
import PageTracker from "@/components/PageTracker";
import InstallApp from "@/components/InstallApp";
import { LocalBusinessJsonLd, WebSiteJsonLd } from "@/components/StructuredData";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DTM PARTS | פגושים טמבונים ומגנים משומשים מייבוא",
    template: "%s | DTM PARTS",
  },
  description:
    "DTM PARTS — פגושים, טמבונים ומגנים משומשים מייבוא לכל יצרני הרכב. מלאי של 2,900+ פריטים, מחירים תחרותיים, משלוח לכל הארץ תוך 24-48 שעות. חיפה.",
  keywords: [
    "טמבונים", "פגושים", "מגנים", "חלקי רכב", "DTM PARTS",
    "פגוש קדמי", "פגוש אחורי", "טמבון משומש", "פגוש מייבוא",
    "חלקי חילוף לרכב", "פגושים משומשים", "טמבונים לביטוח",
    "פגוש לתאונה", "חלקי רכב חיפה",
  ],
  openGraph: {
    title: "DTM PARTS | פגושים טמבונים ומגנים משומשים מייבוא",
    description: "פגושים, טמבונים ומגנים משומשים מייבוא לכל יצרני הרכב. מלאי של 2,900+ פריטים, מחירים תחרותיים, משלוח לכל הארץ.",
    locale: "he_IL",
    type: "website",
    siteName: "DTM PARTS",
    images: [
      {
        url: "/images/DTM.png",
        width: 1200,
        height: 630,
        alt: "DTM PARTS — פגושים וטמבונים משומשים מייבוא",
      },
    ],
  },
  alternates: {
    canonical: "https://dtmparts.co.il",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {
    google: "gPS_iBgaolicy43I6Adsv4Zz58y4n-PkkD4Gds83Q8E",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="DTM PARTS" />
        <link rel="apple-touch-icon" href="/images/logo.jpeg" />
        <meta name="theme-color" content="#1a1a2e" />
      </head>
      <body className="font-sans antialiased">
        <GoogleAnalytics />
        <LocalBusinessJsonLd />
        <WebSiteJsonLd />
        <Providers>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <FloatingChat />
          <CookieBanner />
          <AccessibilityWidget />
          <PageTracker />
          <InstallApp />
        </Providers>
      </body>
    </html>
  );
}
