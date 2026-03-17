import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const results = await prisma.bumperCache.findMany({
      select: { carMake: true },
      distinct: ["carMake"],
      orderBy: { carMake: "asc" },
    });

    const makes = results.map((r) => r.carMake);

    return NextResponse.json(makes);
  } catch (error) {
    console.error("Error fetching makes:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת הנתונים" },
      { status: 500 }
    );
  }
}
