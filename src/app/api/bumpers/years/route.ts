import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractAllYears } from "@/lib/yearParser";
import { normalizeHebrew } from "@/lib/hebrewNormalize";

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

    // Find all DB models matching after normalization
    const normalizedModel = normalizeHebrew(model);
    const allModels = await prisma.bumperCache.findMany({
      where: { carMake: { in: makeFilter } },
      select: { carModel: true },
      distinct: ["carModel"],
    });
    const matchingModels = allModels
      .map((m) => m.carModel)
      .filter((m) => normalizeHebrew(m) === normalizedModel);
    const modelFilter = matchingModels.length > 0 ? matchingModels : [model];

    const results = await prisma.bumperCache.findMany({
      where: {
        carMake: { in: makeFilter },
        carModel: { in: modelFilter },
        status: { in: ["במלאי", "כן"] },
      },
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
