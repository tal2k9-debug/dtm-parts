import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/bumpers/[id] — Fetch a single bumper by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const bumper = await prisma.bumperCache.findUnique({
      where: { id },
    });

    if (!bumper) {
      return NextResponse.json(
        { error: "Bumper not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(bumper);
  } catch (error) {
    console.error("Error fetching bumper:", error);
    return NextResponse.json(
      { error: "Failed to fetch bumper" },
      { status: 500 }
    );
  }
}
