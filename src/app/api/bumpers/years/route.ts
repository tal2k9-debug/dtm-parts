import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractAllYears } from "@/lib/yearParser";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const make = searchParams.get("make");
    const model = searchParams.get("model");

    if (!make || !model) {
      return NextResponse.json(
        { error: "חסרים פרמטרים יצרן ודגם" },
        { status: 400 }
      );
    }

    const results = await prisma.bumperCache.findMany({
      where: { carMake: make, carModel: model },
      select: { carYear: true },
      distinct: ["carYear"],
    });

    const rawYears = results
      .map((r) => r.carYear)
      .filter((y) => y && y.trim().length > 0);

    // Parse all year ranges into individual years (sorted descending)
    const individualYears = extractAllYears(rawYears);

    // Return as strings for the dropdown
    const years = individualYears.map(String);

    return NextResponse.json(years);
  } catch (error) {
    console.error("Error fetching years:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת הנתונים" },
      { status: 500 }
    );
  }
}
