import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { PhoneIcon, MapPinIcon, ClockIcon, TruckIcon } from "@heroicons/react/24/outline";
import { ADMIN_WHATSAPP_LINK, ADMIN_PHONE_INTL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "אודות DTM PARTS — פגושים וטמבונים משומשים מייבוא",
  description:
    "DTM PARTS — חנות חלקי חילוף לרכב בחיפה. ייבוא פגושים, טמבונים ומגנים משומשים לכל יצרני הרכב. מלאי של 2,900+ פריטים, משלוח לכל הארץ.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        {/* Hero with warehouse image */}
        <section className="relative h-[50vh] min-h-[350px] flex items-center justify-center">
          <img
            src="/images/DTM.png"
            alt="מחסן DTM PARTS — פגושים וטמבונים"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
          <div className="relative z-10 text-center px-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
              DTM PARTS
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 font-medium">
              פגושים, טמבונים ומגנים משומשים מייבוא
            </p>
          </div>
        </section>

        {/* About content */}
        <section className="py-16 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none text-right">
              <h2 className="text-2xl font-bold text-text mb-6">מי אנחנו</h2>
              <p className="text-text-secondary leading-relaxed mb-6">
                DTM PARTS היא חברת ייבוא חלקי חילוף לרכב המתמחה בפגושים, טמבונים ומגנים משומשים.
                אנו מייבאים חלקים מכל העולם ומספקים אותם למוסכים, פחחויות, סוחרי רכב ולקוחות פרטיים בכל הארץ.
              </p>
              <p className="text-text-secondary leading-relaxed mb-6">
                המלאי שלנו כולל למעלה מ-2,900 פריטים לכל יצרני הרכב — הונדה, טויוטה, סוזוקי, ניסן, קיה, אאודי, במו, מרצדס, וולבו, סקודה, פולקסווגן ועוד.
                כל פריט עובר בדיקת איכות לפני שליחה ללקוח.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-10">
                <div className="bg-surface rounded-2xl border border-border p-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <TruckIcon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-text text-lg mb-2">משלוח לכל הארץ</h3>
                  <p className="text-text-secondary text-sm">משלוח תוך 24-48 שעות לכל כתובת בישראל</p>
                </div>
                <div className="bg-surface rounded-2xl border border-border p-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <ClockIcon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-text text-lg mb-2">שירות מהיר</h3>
                  <p className="text-text-secondary text-sm">מענה לפניות תוך דקות, הצעת מחיר מיידית</p>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-text mb-6">פרטי התקשרות</h2>
              <div className="bg-surface rounded-2xl border border-border p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <MapPinIcon className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-text">קצנשטיין, חיפה</span>
                </div>
                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-5 h-5 text-primary flex-shrink-0" />
                  <a href={`tel:${ADMIN_PHONE_INTL}`} className="text-primary hover:underline">052-514-4401</a>
                </div>
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-text">ראשון-חמישי 09:00-19:00 | שישי 09:00-13:00</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link href="/catalog" className="flex-1">
                  <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-colors">
                    צפו במלאי
                  </button>
                </Link>
                <a href={ADMIN_WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <button className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-xl transition-colors">
                    שלחו הודעה בוואטסאפ
                  </button>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
