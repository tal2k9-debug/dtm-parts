import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("he-IL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "עכשיו";
  if (diffMins < 60) return `לפני ${diffMins} דקות`;
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  if (diffDays < 7) return `לפני ${diffDays} ימים`;
  return formatDateShort(d);
}

export function getStatusBadge(status: string): {
  label: string;
  className: string;
} {
  switch (status) {
    case "במלאי":
      return { label: "במלאי", className: "badge-in-stock" };
    case "אזל":
      return { label: "אזל מהמלאי", className: "badge-out-of-stock" };
    case "בהזמנה":
      return { label: "בהזמנה", className: "badge-on-order" };
    default:
      return { label: status, className: "bg-gray-200 text-gray-700" };
  }
}

export function getRequestStatusLabel(status: string): {
  label: string;
  color: string;
} {
  switch (status) {
    case "PENDING":
      return { label: "ממתין לטיפול", color: "text-yellow-600 bg-yellow-50" };
    case "QUOTED":
      return { label: "הצעת מחיר נשלחה", color: "text-blue-600 bg-blue-50" };
    case "CLOSED":
      return { label: "סגור", color: "text-green-600 bg-green-50" };
    case "CANCELLED":
      return { label: "בוטל", color: "text-red-600 bg-red-50" };
    default:
      return { label: status, color: "text-gray-600 bg-gray-50" };
  }
}

export function getPositionLabel(position: string): string {
  return position === "FRONT" ? "קדמי" : "אחורי";
}
