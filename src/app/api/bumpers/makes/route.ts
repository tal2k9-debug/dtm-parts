import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeHebrew } from "@/lib/hebrewNormalize";

export async function GET() {
  try {
    const results = await prisma.bumperCache.findMany({
      where: { status: { in: ["במלאי", "כן"] } },
      select: { carMake: true },
      distinct: ["carMake"],
      orderBy: { carMake: "asc" },
    });

    // Filter out empty values and values that look like years/numbers (bad data from Monday)
    const rawMakes = results
      .map((r) => r.carMake)
      .filter((m) => {
        if (!m || m.trim().length < 2) return false;
        if (/\d{4}/.test(m)) return false;
        if (/^[\d\s\-+]+$/.test(m.trim())) return false;
        return true;
      });

    // Deduplicate by normalized form (צ'רי and צרי → keep the one with geresh)
    const seen = new Map<string, string>();
    for (const make of rawMakes) {
      const norm = normalizeHebrew(make);
      const existing = seen.get(norm);
      if (!existing) {
        seen.set(norm, make);
      } else {
        // Prefer the version WITH geresh (more correct Hebrew)
        if (make.includes("'") || make.includes("׳") || make.includes("'")) {
          seen.set(norm, make);
        }
      }
    }

    const makes = Array.from(seen.values()).sort((a, b) => a.localeCompare(b, "he"));

    return NextResponse.json(makes);
  } catch (error) {
    console.error("Error fetching makes:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת הנתונים" },
      { status: 500 }
    );
  }
}
