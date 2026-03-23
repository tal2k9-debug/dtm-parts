export const SITE_NAME = "DTM PARTS";
export const SITE_DESCRIPTION = "מגוון רחב של טמבונים / פגושים / מגנים";
export const SITE_URL = "https://dtmparts.co.il";

// Contact info — single source of truth
export const ADMIN_PHONE = process.env.NEXT_PUBLIC_ADMIN_PHONE || "050-0000000";
export const ADMIN_PHONE_INTL = process.env.NEXT_PUBLIC_ADMIN_PHONE_INTL || "+972500000000";
export const ADMIN_WHATSAPP_LINK = `https://wa.me/${(process.env.NEXT_PUBLIC_ADMIN_PHONE_INTL || "+972500000000").replace("+", "")}`;

export const BUMPERS_BOARD_ID = "3928998531";

export const POSITIONS = [
  { value: "FRONT" as const, label: "קדמי" },
  { value: "REAR" as const, label: "אחורי" },
];

export const REQUEST_STATUSES = [
  { value: "PENDING" as const, label: "ממתין לטיפול", color: "#ffcb00" },
  { value: "QUOTED" as const, label: "הצעת מחיר", color: "#2563EB" },
  { value: "CLOSED" as const, label: "סגור", color: "#00c875" },
  { value: "CANCELLED" as const, label: "בוטל", color: "#df2f4a" },
];

export const POPULAR_MAKES = [
  "יונדאי",
  "קיה",
  "טויוטה",
  "מזדה",
  "ניסאן",
  "שברולט",
  "פולקסווגן",
  "סקודה",
  "סוזוקי",
  "מיצובישי",
  "הונדה",
  "פיג׳ו",
  "סיטרואן",
  "רנו",
  "אופל",
  "פורד",
  "סובארו",
  "BMW",
  "מרצדס",
  "אאודי",
];

export const NAV_LINKS = [
  { href: "/", label: "ראשי" },
  { href: "/catalog", label: "קטלוג" },
  { href: "/about", label: "אודות" },
  { href: "/account", label: "האזור שלי" },
];

export const ADMIN_NAV_LINKS = [
  { href: "/admin", label: "דשבורד" },
  { href: "/admin/scan", label: "קליטת פגוש" },
  { href: "/admin/requests", label: "בקשות" },
  { href: "/admin/customers", label: "לקוחות" },
  { href: "/admin/inventory", label: "מלאי" },
  { href: "/admin/chat", label: "צ׳אט" },
  { href: "/admin/analytics", label: "אנליטיקס" },
  { href: "/admin/online", label: "אונליין" },
  { href: "/admin/monitoring", label: "ניטור" },
  { href: "/admin/settings", label: "הגדרות" },
];
