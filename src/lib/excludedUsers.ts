/**
 * User IDs to exclude from analytics/tracking (staff, testers, etc.)
 * These users are NOT admins but shouldn't be counted in customer stats.
 */
export const EXCLUDED_USER_IDS = [
  "cmmuq4ag30000kv043nmljs7q", // מיחא קוני
];

/**
 * Check if a user should be excluded from tracking
 */
export function isExcludedUser(userId: string | null | undefined, role: string | null | undefined): boolean {
  if (role === "ADMIN") return true;
  if (userId && EXCLUDED_USER_IDS.includes(userId)) return true;
  return false;
}
