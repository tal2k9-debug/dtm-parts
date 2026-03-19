import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "הצהרת נגישות",
  description:
    "הצהרת הנגישות של DTM PARTS — מחויבותנו להנגשת האתר לאנשים עם מוגבלויות בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות.",
};

export default function AccessibilityPage() {
  return (
    <>
      <Header />
      <main className="pt-20 pb-16 bg-background min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-primary hover:underline text-sm mb-6 mt-4"
          >
            → חזרה לעמוד הראשי
          </Link>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-text mb-2">
            הצהרת נגישות
          </h1>
          <p className="text-text-secondary text-sm mb-10">
            עדכון אחרון: מרץ 2026
          </p>

          <div className="space-y-10 text-text-secondary leading-relaxed">
            {/* 1 */}
            <section>
              <h2 className="text-xl font-bold text-text mb-3">
                1. מחויבותנו לנגישות
              </h2>
              <p>
                DTM PARTS מחויבת להנגיש את אתר האינטרנט שלה (dtmparts.co.il)
                לאנשים עם מוגבלויות, בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות,
                התשנ&quot;ח-1998, ולתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות
                נגישות לשירות), התשע&quot;ג-2013.
              </p>
              <p className="mt-3">
                אנו מאמינים שכל אדם זכאי לגישה שוויונית למידע ולשירותים
                המוצעים באתר, ללא קשר למוגבלותו.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-xl font-bold text-text mb-3">
                2. תקן הנגישות
              </h2>
              <p>
                אתר זה תוכנן ופותח במטרה לעמוד בדרישות תקן הנגישות הבינלאומי
                WCAG 2.1 ברמת AA (Web Content Accessibility Guidelines), בהתאם
                לתקן הישראלי ת&quot;י 5568.
              </p>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-xl font-bold text-text mb-3">
                3. מה עשינו כדי להנגיש את האתר
              </h2>
              <p>
                במסגרת מחויבותנו לנגישות, ביצענו ומבצעים את הפעולות הבאות:
              </p>
              <ul className="list-disc list-inside mt-3 space-y-2 pr-4">
                <li>
                  <strong>מבנה סמנטי:</strong> שימוש בתגיות HTML סמנטיות (כותרות,
                  רשימות, טפסים) המאפשרות ניווט תקין עם קוראי מסך.
                </li>
                <li>
                  <strong>תמיכה בקוראי מסך:</strong> האתר תומך בתוכנות קוראי מסך
                  כגון NVDA, JAWS ו-VoiceOver.
                </li>
                <li>
                  <strong>ניווט מקלדת:</strong> ניתן לנווט בכל חלקי האתר באמצעות
                  מקלדת בלבד (Tab, Enter, Escape).
                </li>
                <li>
                  <strong>ניגודיות צבעים:</strong> הקפדה על ניגודיות מספקת בין
                  טקסט לרקע בהתאם לדרישות WCAG AA.
                </li>
                <li>
                  <strong>טקסט חלופי לתמונות:</strong> תמונות המוצגות באתר כוללות
                  תיאור טקסטואלי חלופי (alt text).
                </li>
                <li>
                  <strong>טפסים נגישים:</strong> כל שדות הטופס כוללים תוויות
                  (labels) ברורות והודעות שגיאה מובנות.
                </li>
                <li>
                  <strong>תמיכה בהגדלת טקסט:</strong> האתר תומך בהגדלת טקסט עד
                  200% ללא אובדן תוכן או פונקציונליות.
                </li>
                <li>
                  <strong>עיצוב רספונסיבי:</strong> האתר מותאם לצפייה בכל גודל מסך
                  — מחשב, טאבלט וטלפון נייד.
                </li>
                <li>
                  <strong>שפה ברורה:</strong> שימוש בשפה פשוטה וברורה בעברית,
                  עם סימון שפת העמוד (lang=&quot;he&quot;) וכיוון הטקסט (dir=&quot;rtl&quot;).
                </li>
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-xl font-bold text-text mb-3">
                4. מגבלות נגישות ידועות
              </h2>
              <p>
                למרות מאמצינו, ייתכן שחלק מהתכנים באתר אינם נגישים באופן מלא:
              </p>
              <ul className="list-disc list-inside mt-3 space-y-1 pr-4">
                <li>
                  תמונות מוצרים המגיעות ממקורות חיצוניים (Monday.com) עשויות
                  לחסור בתיאור טקסטואלי מלא.
                </li>
                <li>
                  תכנים דינמיים כגון הצ&apos;אט בזמן אמת עשויים להציב אתגרי נגישות
                  עם חלק מקוראי המסך.
                </li>
              </ul>
              <p className="mt-3">
                אנו עובדים באופן מתמיד לשיפור הנגישות ולטיפול במגבלות אלה.
              </p>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-xl font-bold text-text mb-3">
                5. דרכים חלופיות לקבלת שירות
              </h2>
              <p>
                אם נתקלתם בבעיית נגישות באתר או שאינכם מצליחים לגשת לתוכן מסוים,
                אנו מזמינים אתכם לפנות אלינו ונשמח לסייע בכל דרך חלופית:
              </p>
              <ul className="mt-3 space-y-1 pr-4">
                <li>
                  <strong>טלפון:</strong> 052-514-4401 — ניתן לבצע הזמנה, לקבל
                  הצעת מחיר ולקבל מידע על מלאי בטלפון.
                </li>
                <li>
                  <strong>WhatsApp:</strong> שלחו הודעה ל-052-514-4401.
                </li>
                <li>
                  <strong>דוא&quot;ל:</strong> info@dtmparts.co.il
                </li>
                <li>
                  <strong>הגעה פיזית:</strong> ניתן להגיע למחסן בכתובת
                  קצנשטיין, חיפה בשעות הפעילות.
                </li>
              </ul>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-xl font-bold text-text mb-3">
                6. דיווח על בעיית נגישות
              </h2>
              <p>
                אם גיליתם בעיית נגישות באתר, נשמח לשמוע ולטפל בה. אנא דווחו לנו
                באמצעות אחד מאמצעי הקשר הבאים:
              </p>
              <div className="bg-surface rounded-2xl border border-border p-6 mt-4 space-y-2">
                <p>
                  <strong>רכז נגישות:</strong> טל, DTM PARTS
                </p>
                <p>
                  <strong>טלפון:</strong>{" "}
                  <a href="tel:+972525144401" className="text-primary hover:underline">
                    052-514-4401
                  </a>
                </p>
                <p>
                  <strong>דוא&quot;ל:</strong>{" "}
                  <a
                    href="mailto:info@dtmparts.co.il"
                    className="text-primary hover:underline"
                  >
                    info@dtmparts.co.il
                  </a>
                </p>
                <p>
                  <strong>כתובת:</strong> קצנשטיין, חיפה
                </p>
              </div>
              <p className="mt-4">
                בעת הדיווח, אנא ציינו את הדף בו נתקלתם בבעיה, תיאור הבעיה,
                והכלי בו השתמשתם (דפדפן, קורא מסך וכו&apos;). נשתדל לטפל בפנייה תוך
                14 ימי עסקים.
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-xl font-bold text-text mb-3">
                7. נציבות שוויון זכויות לאנשים עם מוגבלות
              </h2>
              <p>
                אם פנייתכם אלינו לא טופלה לשביעות רצונכם, ניתן לפנות לנציבות
                שוויון זכויות לאנשים עם מוגבלות:
              </p>
              <ul className="mt-3 space-y-1 pr-4">
                <li>טלפון: *6763</li>
                <li>
                  אתר:{" "}
                  <a
                    href="https://www.gov.il/he/departments/units/commission-for-equal-rights-of-persons-with-disabilities"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    נציבות שוויון זכויות לאנשים עם מוגבלות
                  </a>
                </li>
              </ul>
            </section>
          </div>

          {/* Footer links to other legal pages */}
          <div className="mt-16 pt-8 border-t border-border flex flex-wrap gap-6 text-sm">
            <Link href="/terms" className="text-primary hover:underline">
              תנאי שימוש
            </Link>
            <Link href="/privacy" className="text-primary hover:underline">
              מדיניות פרטיות
            </Link>
            <Link href="/about" className="text-primary hover:underline">
              אודות
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
