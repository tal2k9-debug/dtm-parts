/**
 * Hebrew search normalization — handles geresh (׳/'), similar spellings,
 * and common typos so customers always find what they need.
 */

// Map of characters to normalize: remove geresh variations
const GERESH_CHARS = ["'", "׳", "'", "'", "`", "\""];

/**
 * Normalize a Hebrew string for search comparison:
 * - Remove all geresh/apostrophe variations (צ'רי → צרי)
 * - Remove double letters (וו → ו)
 * - Trim and lowercase (for English makes like BMW)
 */
export function normalizeHebrew(text: string): string {
  if (!text) return "";
  let result = text.trim();

  // Remove all geresh/apostrophe characters
  for (const char of GERESH_CHARS) {
    result = result.split(char).join("");
  }

  // Normalize double-vav (וו → ו) for search flexibility
  result = result.replace(/וו/g, "ו");

  // Lowercase for English text (BMW, etc.)
  result = result.toLowerCase();

  return result;
}

/**
 * Check if two Hebrew strings match after normalization.
 * Used for comparing car makes, models, etc.
 */
export function hebrewMatch(a: string, b: string): boolean {
  return normalizeHebrew(a) === normalizeHebrew(b);
}

/**
 * Check if a Hebrew string contains another after normalization.
 * Used for search/filter.
 */
export function hebrewContains(haystack: string, needle: string): boolean {
  return normalizeHebrew(haystack).includes(normalizeHebrew(needle));
}

/**
 * Common Hebrew car make aliases — maps normalized form to display form.
 * When a user types any variant, we find all matching makes.
 */
const MAKE_ALIASES: Record<string, string[]> = {
  "צרי": ["צ'רי", "צרי", "CHERY"],
  "גיפ": ["ג'יפ", "גיפ", "ג׳יפ", "JEEP"],
  "גנסיס": ["ג'נסיס", "גנסיס", "ג׳נסיס", "GENESIS"],
  "מיצובישי": ["מיצובישי", "מיצבושי", "מיצובישי", "MITSUBISHI"],
  "פיגו": ["פיג'ו", "פיגו", "פיג׳ו", "PEUGEOT"],
  "סיטרואן": ["סיטרואן", "סיטרון", "CITROEN"],
  "פולקסוגן": ["פולקסווגן", "פולקסוגן", "פולקסווגן", "VOLKSWAGEN", "VW"],
  "שברולט": ["שברולט", "שבורלט", "שברולה", "CHEVROLET"],
};

/**
 * Find all possible database make values that match user input.
 * Returns array of strings to use in WHERE IN clause.
 */
export function findMakeVariants(userInput: string): string[] {
  const normalized = normalizeHebrew(userInput);

  // Check aliases
  for (const [key, variants] of Object.entries(MAKE_ALIASES)) {
    if (key === normalized || variants.some((v) => normalizeHebrew(v) === normalized)) {
      return variants;
    }
  }

  // No alias found — return original + geresh-stripped version
  const stripped = userInput.trim();
  const withoutGeresh = normalizeHebrew(stripped);

  if (stripped !== withoutGeresh) {
    return [stripped, withoutGeresh];
  }

  return [stripped];
}
