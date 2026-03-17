import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const results = await prisma.bumperCache.findMany({
      where: { carMake: make },
      select: { carModel: true },
      distinct: ["carModel"],
      orderBy: { carModel: "asc" },
    });

    const models = results.map((r) => r.carModel);

    return NextResponse.json(models);
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת הנתונים" },
      { status: 500 }
    );
  }
}
