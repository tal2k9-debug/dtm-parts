import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import Providers from "./Providers";
import FloatingChat from "@/components/chat/FloatingChat";
import ErrorBoundary from "@/components/ErrorBoundary";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DTM PARTS | מגוון רחב של טמבונים / פגושים / מגנים",
  description:
    "DTM PARTS - מגוון רחב של טמבונים, פגושים ומגנים משומשים מייבוא לכל יצרני הרכב. מחירים תחרותיים, משלוח מהיר, שירות אישי והזמנות מיוחדות לפי בקשה.",
  keywords: ["טמבונים", "פגושים", "מגנים", "חלקי רכב", "DTM", "פגוש קדמי", "פגוש אחורי"],
  openGraph: {
    title: "DTM PARTS | מגוון רחב של טמבונים / פגושים / מגנים",
    description: "מגוון רחב של טמבונים, פגושים ומגנים משומשים מייבוא לכל יצרני הרכב",
    locale: "he_IL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="font-sans antialiased">
        <GoogleAnalytics />
        <Providers>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <FloatingChat />
        </Providers>
      </body>
    </html>
  );
}
