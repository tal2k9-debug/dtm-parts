import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import Providers from "./Providers";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DTM PARTS | טמבונים ופגושים לכל סוגי הרכב",
  description:
    "DTM PARTS - מגוון רחב של טמבונים ופגושים משומשים מייבוא לכל יצרני הרכב. מחירים תחרותיים, משלוח מהיר, שירות אישי.",
  keywords: ["טמבונים", "פגושים", "חלקי רכב", "DTM", "פגוש קדמי", "פגוש אחורי"],
  openGraph: {
    title: "DTM PARTS | טמבונים ופגושים לכל סוגי הרכב",
    description: "מגוון רחב של טמבונים ופגושים משומשים מייבוא לכל יצרני הרכב",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
