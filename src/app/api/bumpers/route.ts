import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, Position } from "@prisma/client";

// GET /api/bumpers — Fetch bumpers from BumperCache with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const make = searchParams.get("make");
    const model = searchParams.get("model");
    const year = searchParams.get("year");
    const position = searchParams.get("position");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const where: Prisma.BumperCacheWhereInput = {};

    if (make) {
      where.carMake = make;
    }
    if (model) {
      where.carModel = model;
    }
    if (year) {
      where.carYear = year;
    }
    if (position && (position === "FRONT" || position === "REAR")) {
      where.position = position as Position;
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      where.name = { contains: search };
    }

    const [bumpers, total] = await Promise.all([
      prisma.bumperCache.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { lastSynced: "desc" },
      }),
      prisma.bumperCache.count({ where }),
    ]);

    return NextResponse.json({
      bumpers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching bumpers:", error);
    return NextResponse.json(
      { error: "Failed to fetch bumpers" },
      { status: 500 }
    );
  }
}
