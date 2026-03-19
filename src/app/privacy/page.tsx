import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "מדיניות פרטיות",
  description:
    "מדיניות הפרטיות של DTM PARTS — כיצד אנו אוספים, משתמשים ומגנים על המידע האישי שלכם.",
};

export default function PrivacyPage() {
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
            מדיניות פרטיות
          </h1>
          <p className="text-text-secondary text-sm mb-10">
            עדכון אחרון: מרץ 2026
          </p>

          <div className="space-y-10 text-text-secondary leading-relaxed">
            {/* 1 */}
            <section>
              <h2 className="text-xl font-bold text-text mb-3">1. מבוא</h2>
              <p>
                DTM PARTS (להלן: &quot;החברה&quot;, &quot;אנחנו&quot;) מכבדת את פרטיות
                המשתמשים באתר dtmparts.co.il (להלן: &quot;האתר&quot;). מדיניות פרטיות
                זו מסבירה אילו פרטים אנו אוספים, כיצד אנו משתמשים בהם, וכיצד
                אנו מגנים עליהם — בהתאם לחוק הגנת הפרטיות, התשמ&quot;א-1981 והתקנות
                שהותקנו מכוחו.
              </p>
              <p className="mt-3">
                השימוש באתר מהווה הסכמה לתנאי מדיניות פרטיות זו. אם אינכם מסכימים
                — אנא הימנעו משימוש באתר.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-xl font-bold text-text mb-3">
                2. מידע שאנו אוספים
              </h2>
              <p>אנו אוספים את סוגי המידע הבאים:</p>

              <h3 className="font-bold text-text mt-4 mb-2">
                2.1 מידע שנמסר על ידכם באופן ישיר
              </h3>
              <ul className="list-disc list-inside space-y-1 pr-4">
                <li>שם מלא</li>
                <li>מספר טלפון</li>
                <li>כתובת דוא&quot;ל (אופציונלי)</li>
                <li>שם עסק, כתובת עסק, ח.פ. (לבעלי מוסכים ופחחויות)</li>
                <li>סוג עסק (מוסך / לקוח פרטי / אחר)</li>
                <li>
                  פרטי רכב: יצרן, דגם, שנה ומיקום פגוש (קדמי/אחורי) — לצורך
                  בקשות הצעת מחיר
                </li>
                <li>הודעות טקסט ותמונות שנשלחים דרך הצ&apos;אט באתר</li>
                <li>שם משתמש וסיסמה (מוצפנת) ליצירת חשבון</li>
              </ul>

              <h3 className="font-bold text-text mt-4 mb-2">
                2.2 מידע שנאסף באופן אוטומטי
              </h3>
              <ul className="list-disc list-inside space-y-1 pr-4">
                <li>כתובת IP</li>
                <li>סוג דפדפן ומערכת הפעלה</li>
                <li>דפים שנצפו ומשך השהייה באתר</li>
                <li>מקור ההגעה לאתר (אתר מפנה, מנוע חיפוש)</li>
                <li>נתוני עוגיות (Cookies) — ראו סעיף 5</li>
              </ul>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-xl font-bold text-text mb-3">
                3. כיצד אנו משתמשים במידע
              </h2>
              <p>המידע שנאסף משמש אותנו למטרות הבאות:</p>
              <ul className="list-disc list-inside mt-3 space-y-1 pr-4">
                <li>טיפול בבקשות הצעת מחיר ומענה ללקוחות</li>
                <li>שליחת הצעות מחיר ועדכוני סטטוס הזמנה</li>
                <li>תקשורת עם הלקוח דרך מערכת הצ&apos;אט באתר</li>
                <li>ניהול חשבונות משתמשים</li>
                <li>שיפור חוויית המשתמש באתר</li>
                <li>ניתוח סטטיסטי של השימוש באתר (באופן אנונימי ומצרפי)</li>
                <li>
                  עמידה בדרישות חוקיות ורגולטוריות
                </li>
              </ul>
              <p className="mt-3">
                <strong>אנו לא משתמשים במידע שלכם לשיווק ישיר, דיוור פרסומי או
                מכירת מידע לצדדים שלישיים.</strong>
              </p>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-xl font-bold text-text mb-3">
                4. שיתוף מידע עם צדדים שלישיים
              </h2>
              <p>
                אנו לא מוכרים, משכירים או מעבירים מידע אישי לצדדים שלישיים
                למטרות שיווק. המידע עשוי להיות מועבר לגורמים הבאים אך ורק לצורך
                תפעול האתר:
              </p>
              <ul className="list-disc list-inside mt-3 space-y-2 pr-4">
                <li>
                  <strong>Vercel</strong> — שירות אירוח האתר. השרתים ממוקמים
                  בחו&quot;ל. Vercel פועלת בהתאם לתקני אבטחה מחמירים.
                </li>
                <li>
                  <strong>Neon (PostgreSQL)</strong> — שירות מסד הנתונים בו
                  נשמרים פרטי הלקוחות וההזמנות.
                </li>
                <li>
                  <strong>Monday.com</strong> — מערכת ניהול מלאי. משמשת לסנכרון
                  נתוני מלאי פגושים בלבד. פרטי לקוחות אינם מועברים ל-Monday.com.
                </li>
                <li>
                  <strong>Google Analytics</strong> — ניתוח שימוש באתר. נאסף מידע
                  אנונימי ומצרפי בלבד על דפוסי גלישה. ראו{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    מדיניות הפרטיות של Google
                  </a>
                  .
                </li>
                <li>
                  <strong>Twilio</strong> — שירות שליחת הודעות WhatsApp. משמש
                  לשליחת התראות פנימיות למנהל העסק בלבד, ולא לשליחת הודעות
                  ללקוחות.
                </li>
                <li>
                  <strong>Pusher</strong> — שירות תקשורת בזמן אמת לצ&apos;אט באתר.
                </li>
              </ul>
              <p className="mt-3">
                בנוסף, עשויים להעביר מידע לרשויות מוסמכות ככל שנדרש על פי דין.
              </p>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-xl font-bold text-text mb-3">
                5. עוגיות (Cookies) וטכנולוגיות מעקב
              </h2>
              <p>האתר משתמש בעוגיות למטרות הבאות:</p>
              <ul className="list-disc list-inside mt-3 space-y-1 pr-4">
                <li>
                  <strong>עוגיות הכרחיות:</strong> לתפעול האתר, שמירת סשן
                  התחברות, ואבטחה.
                </li>
                <li>
                  <strong>עוגיות ניתוח:</strong> Google Analytics — לניתוח דפוסי
                  שימוש באתר ושיפור החוויה.
                </li>
              </ul>
              <p className="mt-3">
                ניתן לחסום עוגיות דרך הגדרות הדפדפן, אך חסימה עלולה לפגוע
                בתפקוד האתר (לדוגמה, ייתכן שלא תוכלו להתחבר לחשבונכם).
              </p>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-xl font-bold text-text mb-3">6. אבטחת מידע</h2>
              <p>
                אנו נוקטים באמצעי אבטחה סבירים ומקובלים כדי להגן על המידע האישי
                שלכם, לרבות:
              </p>
              <ul className="list-disc list-inside mt-3 space-y-1 pr-4">
                <li>הצפנת סיסמאות בטכנולוגיית bcrypt</li>
                <li>תקשורת מוצפנת (HTTPS/SSL) בכל דפי האתר</li>
                <li>הגבלת גישה למידע לבעלי הרשאה בלבד</li>
                <li>שימוש בשירותי אירוח ומסד נתונים עם תקני אבטחה מחמירים</li>
              </ul>
              <p className="mt-3">
                עם זאת, אין אנו יכולים להבטיח אבטחה מוחלטת של מידע המועבר
                באינטרנט. אנו ממליצים לשמור על סודיות הסיסמה ולא לחלוק אותה עם
                אחרים.
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-xl font-bold text-text mb-3">
                7. זכויות המשתמש
              </h2>
              <p>
                בהתאם לחוק הגנת הפרטיות, עומדות לכם הזכויות הבאות:
              </p>
              <ul className="list-disc list-inside mt-3 space-y-1 pr-4">
                <li>
                  <strong>זכות עיון:</strong> לעיין במידע האישי שנשמר אודותיכם
                  במאגרי החברה.
                </li>
                <li>
                  <strong>זכות תיקון:</strong> לבקש תיקון מידע שגוי או לא מעודכן.
                </li>
                <li>
                  <strong>זכות מחיקה:</strong> לבקש מחיקת המידע האישי שלכם
                  (בכפוף לחובות שמירה על פי דין).
                </li>
                <li>
                  <strong>זכות התנגדות:</strong> להתנגד לשימוש במידע שלכם לצרכים
                  מסוימים.
                </li>
              </ul>
              <p className="mt-3">
                לצורך מימוש זכויותיכם, אנא פנו אלינו באמצעות פרטי הקשר בסעיף 9.
                נשיב לבקשתכם תוך 30 יום.
              </p>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-xl font-bold text-text mb-3">
                8. שמירת מידע
              </h2>
              <p>
                אנו שומרים את המידע האישי שלכם כל עוד חשבונכם פעיל או כל עוד
                נדרש לנו לצורך מתן שירות. מידע על הזמנות ובקשות נשמר למשך 7 שנים
                לצרכי רישום ודיווח, בהתאם לדרישות החוק.
              </p>
              <p className="mt-3">
                לאחר תקופת השמירה, המידע יימחק או ייהפך לאנונימי.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-xl font-bold text-text mb-3">
                9. שינויים במדיניות הפרטיות
              </h2>
              <p>
                אנו עשויים לעדכן את מדיניות הפרטיות מעת לעת. שינויים מהותיים
                יפורסמו באתר. המשך השימוש באתר לאחר פרסום השינויים מהווה הסכמה
                למדיניות המעודכנת.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-xl font-bold text-text mb-3">10. יצירת קשר</h2>
              <p>
                לכל שאלה, בקשה או תלונה בנוגע למדיניות הפרטיות או לטיפול במידע
                האישי שלכם, ניתן לפנות אלינו:
              </p>
              <ul className="mt-3 space-y-1 pr-4">
                <li>
                  <strong>DTM PARTS</strong>
                </li>
                <li>טלפון: 052-514-4401</li>
                <li>דוא&quot;ל: info@dtmparts.co.il</li>
                <li>כתובת: קצנשטיין, חיפה</li>
              </ul>
            </section>
          </div>

          {/* Footer links to other legal pages */}
          <div className="mt-16 pt-8 border-t border-border flex flex-wrap gap-6 text-sm">
            <Link href="/terms" className="text-primary hover:underline">
              תנאי שימוש
            </Link>
            <Link href="/accessibility" className="text-primary hover:underline">
              הצהרת נגישות
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
