import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const results = await prisma.bumperCache.findMany({
      select: { carMake: true },
      distinct: ["carMake"],
      orderBy: { carMake: "asc" },
    });

    // Filter out empty values and values that look like years/numbers (bad data from Monday)
    const makes = results
      .map((r) => r.carMake)
      .filter((m) => {
        if (!m || m.trim().length < 2) return false;
        // Filter out anything that contains year patterns:
        // "2017+", "+2017", "2010-2014", "2018-2021", "2021+", etc.
        if (/\d{4}/.test(m)) return false;
        return true;
      });

    return NextResponse.json(makes);
  } catch (error) {
    console.error("Error fetching makes:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת הנתונים" },
      { status: 500 }
    );
  }
}
