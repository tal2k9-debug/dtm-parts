import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, Position } from "@prisma/client";

// Transform protected Monday.com URLs to proxy URLs
function transformImageUrl(url: string | null): string | null {
  if (!url) return null;
  // Already a proxy URL
  if (url.startsWith("/api/images/monday/")) return url;
  // Protected Monday URL: extract resource ID and proxy it
  const match = url.match(/monday\.com\/protected_static\/\d+\/resources\/(\d+)\//);
  if (match) {
    return `/api/images/monday/${match[1]}`;
  }
  return url;
}

// Normalize status values from Monday ("כן"/"לא") to display values
function normalizeStatus(status: string): string {
  if (status === "כן") return "במלאי";
  if (status === "לא") return "אזל";
  return status;
}

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
      // Map logical filter values to actual DB values (handles both old and new data)
      if (status === "instock") {
        where.status = { in: ["במלאי", "כן"] };
      } else if (status === "outofstock") {
        where.status = { in: ["אזל", "לא"] };
      } else {
        where.status = status;
      }
    }
    if (search) {
      where.name = { contains: search };
    }

    const [rawBumpers, total] = await Promise.all([
      prisma.bumperCache.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { lastSynced: "desc" },
      }),
      prisma.bumperCache.count({ where }),
    ]);

    // Transform protected Monday URLs to proxy URLs and normalize status
    const bumpers = rawBumpers.map((b) => ({
      ...b,
      imageUrl: transformImageUrl(b.imageUrl),
      status: normalizeStatus(b.status),
    }));

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
