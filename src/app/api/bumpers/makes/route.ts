import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const results = await prisma.bumperCache.findMany({
      select: { carMake: true },
      distinct: ["carMake"],
      orderBy: { carMake: "asc" },
    });

    // Filter out values that look like years/numbers (bad data from Monday)
    const makes = results
      .map((r) => r.carMake)
      .filter((m) => m && !/^\+?\d{4}/.test(m) && !/^\d{4}\s*-\s*\d{4}$/.test(m) && m.length > 1);

    return NextResponse.json(makes);
  } catch (error) {
    console.error("Error fetching makes:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת הנתונים" },
      { status: 500 }
    );
  }
}
