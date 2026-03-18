/**
 * Parses messy year strings from Monday.com into a set of individual years.
 * Handles formats like: "2015-2022", "15-18", "2019+", "17+", "עד 2019",
 * "2018 2020", "15 -18", etc.
 * Returns empty array for non-year data (model codes like E30, F10, W205, etc.)
 */

const CURRENT_YEAR = new Date().getFullYear();
const MAX_YEAR = CURRENT_YEAR + 2; // Allow slight future
const MIN_YEAR = 1990;

/** Convert 2-digit year to 4-digit */
function toFullYear(y: number): number {
  if (y >= MIN_YEAR && y <= MAX_YEAR) return y;
  if (y >= 0 && y <= 99) {
    const full = y < 50 ? 2000 + y : 1900 + y;
    if (full >= MIN_YEAR && full <= MAX_YEAR) return full;
  }
  return -1;
}

/** Check if a number is a valid year */
function isValidYear(y: number): boolean {
  return y >= MIN_YEAR && y <= MAX_YEAR;
}

/** Generate range of years from start to end (inclusive) */
function yearRange(start: number, end: number): number[] {
  if (start > end) return [];
  if (end - start > 40) return []; // Sanity check
  const result: number[] = [];
  for (let y = start; y <= end; y++) {
    result.push(y);
  }
  return result;
}

export function parseYearString(raw: string | null | undefined): number[] {
  if (!raw) return [];

  // Clean up: trim, remove asterisks, dots (ניקוד), question marks, extra whitespace
  let s = raw.trim()
    .replace(/[*?]/g, "")
    .replace(/\u05BC/g, "") // Remove Hebrew niqqud (ּ)
    .replace(/\s+/g, " ")
    .trim();

  if (!s) return [];

  // Skip known non-year patterns (model codes, body styles, Hebrew text)
  if (/^[A-Za-z]{1,2}\d{1,3}$/i.test(s)) return []; // E30, F10, W205, K14, etc.
  if (/^[A-Za-z]{2,}$/i.test(s)) return []; // MK3, PRE, RS FL, etc.
  if (/^(E|F|G|W|X|R)\d/i.test(s) && !/^\d{4}/.test(s)) return []; // Model codes
  if (/^[A-Z]{2,}\s/i.test(s) && !/^\d/.test(s)) return []; // "RS FL", "PRE 2014", "ND 2015+"
  if (/^[א-ת]/.test(s) && !/\d/.test(s)) return []; // Pure Hebrew without numbers (אוקטביה, חדש, etc.)

  // Handle Hebrew prefixed patterns
  // "עד 2019" → up to 2019
  const upToMatch = s.match(/עד\s*(\d{2,4})/);
  if (upToMatch) {
    const y = toFullYear(parseInt(upToMatch[1]));
    if (isValidYear(y)) return yearRange(Math.max(MIN_YEAR, y - 10), y);
    return [];
  }

  // "מ 23" → from 2023
  const fromMatch = s.match(/^מ\s*(\d{2,4})/);
  if (fromMatch) {
    const y = toFullYear(parseInt(fromMatch[1]));
    if (isValidYear(y)) return yearRange(y, Math.min(MAX_YEAR, y + 5));
    return [];
  }

  // "PRE 2014" → before 2014
  const preMatch = s.match(/^PRE\s*(\d{4})/i);
  if (preMatch) {
    const y = parseInt(preMatch[1]);
    if (isValidYear(y)) return yearRange(Math.max(MIN_YEAR, y - 10), y);
    return [];
  }

  // "ND 2015+" or "w212 2016" — extract year part
  const modelYearMatch = s.match(/[A-Za-z]\w*\s+(\d{4})\+?/);
  if (modelYearMatch) {
    const y = parseInt(modelYearMatch[1]);
    if (isValidYear(y)) {
      if (s.includes("+")) return yearRange(y, Math.min(MAX_YEAR, y + 5));
      return [y];
    }
    return [];
  }

  // Handle Excel date artifacts: "Dec-15" → December 2015, "Nov-14" → November 2014
  const excelMatch = s.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{2})$/i);
  if (excelMatch) {
    const y = toFullYear(parseInt(excelMatch[2]));
    if (isValidYear(y)) return [y];
    return [];
  }

  // "6-Sep" → not a year
  if (/^[A-Za-z]/.test(s) || /[A-Za-z]$/.test(s)) {
    // Try to find a 4-digit year inside
    const fourDigit = s.match(/\b(19|20)\d{2}\b/g);
    if (fourDigit) {
      const years = fourDigit.map(Number).filter(isValidYear);
      if (years.length === 1 && s.includes("+")) {
        return yearRange(years[0], Math.min(MAX_YEAR, years[0] + 5));
      }
      return years;
    }
    return [];
  }

  // Now handle numeric patterns
  // Remove letter suffixes like "nc" from "2012+ nc"
  s = s.replace(/\s*[a-zA-Z]+\s*/g, " ").trim();

  // "YYYY+" pattern
  const plusMatch4 = s.match(/^(\d{4})\+$/);
  if (plusMatch4) {
    const y = parseInt(plusMatch4[1]);
    if (isValidYear(y)) return yearRange(y, Math.min(MAX_YEAR, y + 5));
    return [];
  }

  // "YY+" pattern (short year)
  const plusMatch2 = s.match(/^(\d{2})\+$/);
  if (plusMatch2) {
    const y = toFullYear(parseInt(plusMatch2[1]));
    if (isValidYear(y)) return yearRange(y, Math.min(MAX_YEAR, y + 5));
    return [];
  }

  // "YYYY-YYYY" range (allow double dashes, spaces around dash)
  const range4 = s.match(/^-?(\d{4})\s*-+\s*(\d{4})$/);
  if (range4) {
    let start = parseInt(range4[1]);
    let end = parseInt(range4[2]);
    // Fix swapped years like "2018-2013"
    if (start > end) [start, end] = [end, start];
    // Fix typos like "2108-2022"
    if (start > MAX_YEAR && start >= 2100 && start <= 2199) start -= 100;
    if (end > MAX_YEAR && end >= 2100 && end <= 2199) end -= 100;
    if (isValidYear(start) && isValidYear(end)) return yearRange(start, end);
    return [];
  }

  // "YY-YY" range (short years)
  const range2 = s.match(/^(\d{2})\s*-+\s*(\d{2})$/);
  if (range2) {
    let start = toFullYear(parseInt(range2[1]));
    let end = toFullYear(parseInt(range2[2]));
    if (start > end) [start, end] = [end, start];
    if (isValidYear(start) && isValidYear(end)) return yearRange(start, end);
    return [];
  }

  // "YYYY-YY" mixed range (e.g., "2019-20")
  const rangeMixed = s.match(/^(\d{4})\s*-+\s*(\d{2})$/);
  if (rangeMixed) {
    const start = parseInt(rangeMixed[1]);
    const endShort = parseInt(rangeMixed[2]);
    const century = Math.floor(start / 100) * 100;
    let end = century + endShort;
    if (end < start) end += 100; // "2019-20" → 2019-2020
    if (isValidYear(start) && isValidYear(end)) return yearRange(start, end);
    return [];
  }

  // "YYYY YYYY" space-separated (e.g., "2018 2020", "2014 2017")
  const spaceYears = s.match(/^(\d{4})\s+(\d{4})$/);
  if (spaceYears) {
    let start = parseInt(spaceYears[1]);
    let end = parseInt(spaceYears[2]);
    if (start > end) [start, end] = [end, start];
    if (isValidYear(start) && isValidYear(end)) return yearRange(start, end);
    return [];
  }

  // Single 4-digit year
  const single4 = s.match(/^(\d{4})$/);
  if (single4) {
    const y = parseInt(single4[1]);
    if (isValidYear(y)) return [y];
    return [];
  }

  // Single 2-digit year
  const single2 = s.match(/^(\d{2})$/);
  if (single2) {
    const y = toFullYear(parseInt(single2[1]));
    if (isValidYear(y)) return [y];
    return [];
  }

  // "YYYY-" (trailing dash, like "2012-")
  const trailingDash = s.match(/^(\d{4})-$/);
  if (trailingDash) {
    const y = parseInt(trailingDash[1]);
    if (isValidYear(y)) return yearRange(y, Math.min(MAX_YEAR, y + 5));
    return [];
  }

  // "F32 33 36" model codes — not years
  // Single digit — not a year
  if (/^\d$/.test(s)) return [];

  return [];
}

/**
 * Check if a specific year is covered by a year string.
 * E.g., doesYearMatch("2015-2022", 2018) → true
 */
export function doesYearMatch(yearString: string | null | undefined, targetYear: number): boolean {
  const years = parseYearString(yearString);
  return years.includes(targetYear);
}

/**
 * Extract all unique individual years from an array of year strings.
 * Returns sorted array of 4-digit years.
 */
export function extractAllYears(yearStrings: string[]): number[] {
  const allYears = new Set<number>();
  for (const ys of yearStrings) {
    for (const y of parseYearString(ys)) {
      allYears.add(y);
    }
  }
  return [...allYears].sort((a, b) => b - a); // Descending (newest first)
}
