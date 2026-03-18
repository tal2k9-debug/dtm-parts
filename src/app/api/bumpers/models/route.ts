import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeHebrew } from "@/lib/hebrewNormalize";

// Extract the "base model" from variants like "A CLASS 176" → "A CLASS"
// Keeps known suffixes that are meaningful model names
function getBaseModel(model: string): string {
  const trimmed = model.trim();

  // Remove trailing numbers/codes like "176", "177", "W205", "253", etc.
  // Pattern: strip trailing segments that are just numbers, or W+numbers, or single letters
  const parts = trimmed.split(/\s+/);
  const baseParts: string[] = [];

  for (const part of parts) {
    // Keep words, skip: pure numbers (176, 205), chassis codes (W205, W169),
    // "LIFT", "AMG", "COUPE", "סדאן", "קופה" — these are trim levels, keep the base
    if (/^\d+$/.test(part)) continue; // pure number like 176, 205
    if (/^[A-Z]\d+$/.test(part)) continue; // chassis code like W205, W169
    if (part === "LIFT" || part === "COUPE" || part === "סדאן" || part === "קופה") continue;
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

    // Find all DB makes matching after geresh normalization
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
      where: { carMake: { in: makeFilter } },
      select: { carModel: true },
      distinct: ["carModel"],
      orderBy: { carModel: "asc" },
    });

    // Group by base model name to collapse variants
    // "A CLASS 176", "A CLASS 177", "A CLASS W169" → "A CLASS"
    // But keep unique base models: "A CLASS", "B CLASS", "C CLASS" stay separate
    const baseModelMap = new Map<string, string>();

    for (const r of results) {
      if (!r.carModel || r.carModel.trim().length === 0) continue;
      const normalized = normalizeHebrew(r.carModel);
      const base = normalizeHebrew(getBaseModel(r.carModel));

      if (!baseModelMap.has(base)) {
        // Use the shortest/cleanest variant as display name
        baseModelMap.set(base, getBaseModel(r.carModel));
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
