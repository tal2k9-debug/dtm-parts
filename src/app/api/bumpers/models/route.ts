import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeHebrew } from "@/lib/hebrewNormalize";

/**
 * Extract the "base model" from a full model string.
 * Groups variants so the dropdown shows clean options.
 *
 * Examples:
 *   "A CLASS 176"       → "A CLASS"
 *   "A CLASS W177"      → "A CLASS"
 *   "A CLASS AMG 177"   → "A CLASS AMG"
 *   "C CLASS W205 AMG COUPE" → "C CLASS AMG"
 *   "גולף 7.5"          → "גולף"
 *   "גולף GTI"          → "גולף GTI"
 *   "X3 F25 LIFT"       → "X3"
 *   "סדרה 3GT"          → "סדרה"
 */
function getBaseModel(model: string): string {
  const trimmed = model.trim();
  const parts = trimmed.split(/\s+/);
  const baseParts: string[] = [];

  for (const part of parts) {
    // Skip pure numbers: 176, 205, 212, 7.5, 63
    if (/^\d+[\.\d]*$/.test(part)) continue;
    // Skip chassis/generation codes: W205, W169, F20, G30, E92, W166
    if (/^[A-Z]\d{1,3}$/i.test(part)) continue;
    // Skip "LIFT", "FL", "LCI", "COUPE", "סדאן", "קופה", "סטיישן", "האצבק", "OG"
    if (/^(LIFT|FL|LCI|COUPE|OG|COMP|MPACK|MPAK|PACK)$/i.test(part)) continue;
    if (/^(סדאן|קופה|סטיישן|האצבק|קומפקט|מקסי|גרנד)$/.test(part)) continue;
    baseParts.push(part);
  }

  return baseParts.join(" ") || trimmed;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const make = searchParams.get("make");

    if (!make) {
      return NextResponse.json(
        { error: "חסר פרמטר יצרן" },
        { status: 400 }
      );
    }

    // Find all DB makes matching after normalization
    const normalizedMake = normalizeHebrew(make);
    const allMakes = await prisma.bumperCache.findMany({
      select: { carMake: true },
      distinct: ["carMake"],
    });
    const matchingMakes = allMakes
      .map((m) => m.carMake)
      .filter((m) => normalizeHebrew(m) === normalizedMake);

    const makeFilter = matchingMakes.length > 0 ? matchingMakes : [make];

    const results = await prisma.bumperCache.findMany({
      where: { carMake: { in: makeFilter }, status: { in: ["במלאי", "כן"] } },
      select: { carModel: true },
      distinct: ["carModel"],
      orderBy: { carModel: "asc" },
    });

    // Group by NORMALIZED base model to collapse all variants
    // "A CLASS 176", "A CLASS W177", "Aקלאס" → all normalize to "a class" → show "A CLASS"
    const baseModelMap = new Map<string, string>();

    for (const r of results) {
      if (!r.carModel || r.carModel.trim().length === 0) continue;

      const base = getBaseModel(r.carModel);
      const normalizedBase = normalizeHebrew(base);

      if (!baseModelMap.has(normalizedBase)) {
        // Prefer the English/longer form as display name
        baseModelMap.set(normalizedBase, base);
      } else {
        // If we already have this base, prefer the version with English/longer text
        const existing = baseModelMap.get(normalizedBase)!;
        if (base.length > existing.length || (/[A-Z]/.test(base) && !/[A-Z]/.test(existing))) {
          baseModelMap.set(normalizedBase, base);
        }
      }
    }

    const models = Array.from(baseModelMap.values()).sort((a, b) => a.localeCompare(b, "he"));

    return NextResponse.json(models);
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת הנתונים" },
      { status: 500 }
    );
  }
}
