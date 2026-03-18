import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeHebrew } from "@/lib/hebrewNormalize";

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

    // Deduplicate models by normalized form too
    const seen = new Map<string, string>();
    for (const r of results) {
      if (!r.carModel || r.carModel.trim().length === 0) continue;
      const norm = normalizeHebrew(r.carModel);
      if (!seen.has(norm)) {
        seen.set(norm, r.carModel);
      }
    }

    const models = Array.from(seen.values()).sort((a, b) => a.localeCompare(b, "he"));

    return NextResponse.json(models);
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת הנתונים" },
      { status: 500 }
    );
  }
}
