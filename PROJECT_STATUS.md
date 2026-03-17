# DTM PARTS — סטטוס פרויקט
> עדכון אחרון: 17.03.2026

---

## כתובות חשובות

| מה | כתובת |
|----|--------|
| האתר | https://dtm-parts.vercel.app |
| פאנל אדמין | https://dtm-parts.vercel.app/admin |
| GitHub | https://github.com/tal2k9-debug/dtm-parts |
| Neon (DB) | https://console.neon.tech |
| Vercel | https://vercel.com |

---

## פרטי התחברות אדמין

- שם משתמש: `DTM`
- סיסמה: `ST9793rfkp`

---

## מה עובד עכשיו (✅)

### אתר לקוחות
- ✅ דף בית עם בורר רכב (יצרן → דגם → שנה → קדמי/אחורי)
- ✅ קטלוג טמבונים מלא — 2,926 פריטים מסונכרנים ממאנדי
- ✅ 1,054 במלאי | 2,746 עם תמונות
- ✅ סינון לפי: יצרן, דגם, שנה, מיקום, סטטוס
- ✅ דף טמבון בודד עם גלריית תמונות (כל התמונות ממאנדי)
- ✅ טופס בקשת מחיר
- ✅ הרשמה והתחברות (שם משתמש + סיסמה)
- ✅ אזור אישי ללקוח (הבקשות שלי)
- ✅ תגיות סטטוס: במלאי (ירוק) / אזל (אדום)
- ✅ RTL עברית מלא, פונט Heebo

### פאנל אדמין (/admin)
- ✅ דשבורד עם סטטיסטיקות (בקשות, לקוחות, הכנסות)
- ✅ ניהול בקשות מחיר (טבלה + סינון + פעולות)
- ✅ רשימת לקוחות + פרופיל מפורט
- ✅ מלאי טמבונים + כפתור סנכרון ידני
- ✅ הגדרות (וואטסאפ, תבניות)
- ✅ צ'אט עם לקוחות

### תשתית
- ✅ חיבור Monday.com (לוח מלאי טמבונים 2026, ID: 3928998531)
- ✅ סנכרון אוטומטי ממאנדי (API sync)
- ✅ תמונות עוברות דרך proxy (מאנדי → /api/images/monday/[assetId])
- ✅ בסיס נתונים PostgreSQL ב-Neon
- ✅ Deploy אוטומטי מ-GitHub ל-Vercel

---

## מה עדיין לא הוגדר (⏳)

### דורש הגדרה ממך:
1. **Google Login** — צריך ליצור OAuth credentials ב-Google Cloud Console
2. **Twilio WhatsApp** — התראות וואטסאפ לטל על בקשות חדשות
3. **Pusher** — צ'אט בזמן אמת (כרגע הצ'אט שומר הודעות אבל בלי push)
4. **דומיין** — לחבר dtmparts.co.il ב-Vercel (Settings → Domains)

### דורש פיתוח נוסף:
5. **Google Sign-In** — להוסיף כפתור "התחבר עם Google"
6. **סטטיסטיקות משתמשים** — כמה נרשמו, כמה מתחברים, מתי
7. **Cron job** — סנכרון אוטומטי כל 15 דקות (Vercel Cron)
8. **Monday Webhook** — סנכרון מיידי כשמשתנה סטטוס במאנדי

---

## מבנה טכני

### Tech Stack
- **Frontend:** Next.js 14+ (App Router) + Tailwind CSS
- **Database:** PostgreSQL via Neon
- **ORM:** Prisma
- **Auth:** NextAuth.js (credentials)
- **Inventory:** Monday.com GraphQL API (read-only)
- **Hosting:** Vercel (auto-deploy from GitHub)

### מבנה תיקיות חשוב
```
src/
  app/
    page.tsx              → דף בית
    catalog/              → קטלוג טמבונים
    catalog/[id]/         → דף טמבון בודד
    quote/                → טופס בקשת מחיר
    login/                → כניסה
    register/             → הרשמה
    account/              → אזור לקוח
    admin/                → פאנל אדמין
    api/
      bumpers/            → API קטלוג
      monday/sync/        → סנכרון ממאנדי
      webhooks/monday/    → webhook ממאנדי
      images/monday/[id]/ → proxy תמונות
      auth/               → NextAuth
      quotes/             → בקשות מחיר
      chat/               → צ'אט
  lib/
    monday.ts             → חיבור Monday.com API
    prisma.ts             → חיבור DB
    pusher.ts             → חיבור Pusher
    whatsapp.ts           → שליחת WhatsApp
  components/             → קומפוננטות UI
  types/                  → TypeScript types
prisma/
  schema.prisma           → סכמת בסיס הנתונים
  seed.ts                 → יצירת משתמש אדמין
```

### Environment Variables (ב-Vercel)
```
DATABASE_URL=postgresql://neondb_owner:...@ep-empty-tree-...neon.tech/neondb?sslmode=require
MONDAY_API_KEY=eyJhbGci...
NEXTAUTH_SECRET=dtm-parts-secret-2026-prod
NEXTAUTH_URL=https://dtm-parts.vercel.app
```

### עמודות Monday.com (מיפוי)
| עמודה במאנדי | Column ID | שדה באתר |
|-------------|-----------|----------|
| שם הפריט | (item name) | catalogNumber / name |
| יצרן | text | carMake |
| דגם | text0 | carModel |
| שנה | text5 | carYear |
| מיקום | color | position (קדמי/אחורי) |
| צבע | text4 | color |
| מצב | text6 | condition |
| במלאי | color_mkwzjzja | status (כן→במלאי, לא→אזל) |
| תמונות | file6 | imageUrls |

---

## איך לעשות דברים נפוצים

### לסנכרן מלאי ממאנדי
אפשרות 1: מהאדמין → מלאי → כפתור "סנכרון"
אפשרות 2: לגשת ל- https://dtm-parts.vercel.app/api/monday/sync

### לשנות סיסמת אדמין
להריץ ב-Claude Code:
```
node -e "require('dotenv').config(); ..."
```
(כמו שעשינו קודם)

### לעדכן קוד
1. לשנות קבצים מקומית
2. `git add -A && git commit -m "הודעה" && git push`
3. Vercel בונה אוטומטית תוך 1-2 דקות

### לחבר דומיין
1. Vercel → Settings → Domains → Add
2. להוסיף DNS record אצל ספק הדומיין

---

*נוצר ב-17.03.2026 | DTM PARTS Customer Portal v1.0*
