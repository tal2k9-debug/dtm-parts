import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
      orderBy: { carYear: "desc" },
    });

    const years = results
      .map((r) => r.carYear)
      .filter((y) => y && y.trim().length > 0);

    return NextResponse.json(years);
  } catch (error) {
    console.error("Error fetching years:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת הנתונים" },
      { status: 500 }
    );
  }
}
