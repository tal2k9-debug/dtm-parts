import { prisma } from "./prisma";

export type LogLevel = "info" | "warn" | "error" | "critical";
export type LogSource =
  | "monday_sync"
  | "whatsapp"
  | "auth"
  | "api"
  | "db"
  | "health"
  | "self_heal"
  | "chat"
  | "quotes";

interface LogEntry {
  level: LogLevel;
  source: LogSource;
  message: string;
  details?: Record<string, unknown>;
  autoHealed?: boolean;
  healAction?: string;
}

// In-memory buffer for rate limiting WhatsApp alerts
const alertCooldowns = new Map<string, number>();
const ALERT_COOLDOWN_MS = 5 * 60 * 1000; // 5 min between same alerts

async function sendCriticalAlert(entry: LogEntry) {
  const cooldownKey = `${entry.source}:${entry.message.slice(0, 50)}`;
  const lastAlert = alertCooldowns.get(cooldownKey) || 0;

  if (Date.now() - lastAlert < ALERT_COOLDOWN_MS) return;
  alertCooldowns.set(cooldownKey, Date.now());

  try {
    const { notifyAdmin } = await import("./whatsapp");
    const emoji = entry.autoHealed ? "🔧" : "🚨";
    const healNote = entry.autoHealed ? `\nתיקון אוטומטי: ${entry.healAction}` : "";

    await notifyAdmin(
      `${emoji} שגיאה באתר DTM!\n` +
        `מקור: ${entry.source}\n` +
        `הודעה: ${entry.message}${healNote}\n` +
        `זמן: ${new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })}`
    );
  } catch {
    console.error("[Logger] Failed to send WhatsApp alert");
  }
}

export async function log(entry: LogEntry) {
  const timestamp = new Date().toISOString();
  const prefix = `[${entry.level.toUpperCase()}][${entry.source}]`;

  // Console log
  const consoleMsg = `${prefix} ${entry.message}`;
  switch (entry.level) {
    case "info":
      console.log(consoleMsg);
      break;
    case "warn":
      console.warn(consoleMsg);
      break;
    case "error":
    case "critical":
      console.error(consoleMsg, entry.details || "");
      break;
  }

  // Persist to DB (non-blocking for info/warn)
  const persist = async () => {
    try {
      await prisma.systemEvent.create({
        data: {
          level: entry.level,
          source: entry.source,
          message: entry.message,
          details: entry.details ? JSON.stringify(entry.details) : null,
          autoHealed: entry.autoHealed || false,
          healAction: entry.healAction || null,
        },
      });
    } catch (dbErr) {
      console.error("[Logger] Failed to persist event:", dbErr);
    }
  };

  // For critical/error: persist immediately + WhatsApp alert
  if (entry.level === "critical" || entry.level === "error") {
    await persist();
    if (entry.level === "critical") {
      await sendCriticalAlert(entry);
    }
  } else {
    // Non-blocking persist for info/warn
    persist().catch(() => {});
  }
}

// Convenience methods
export const logger = {
  info: (source: LogSource, message: string, details?: Record<string, unknown>) =>
    log({ level: "info", source, message, details }),

  warn: (source: LogSource, message: string, details?: Record<string, unknown>) =>
    log({ level: "warn", source, message, details }),

  error: (source: LogSource, message: string, details?: Record<string, unknown>) =>
    log({ level: "error", source, message, details }),

  critical: (source: LogSource, message: string, details?: Record<string, unknown>) =>
    log({ level: "critical", source, message, details }),

  selfHealed: (source: LogSource, message: string, healAction: string, details?: Record<string, unknown>) =>
    log({ level: "warn", source, message, details, autoHealed: true, healAction }),
};
