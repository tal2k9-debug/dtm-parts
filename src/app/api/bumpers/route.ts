import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, Position } from "@prisma/client";
import { doesYearMatch } from "@/lib/yearParser";
import { normalizeHebrew } from "@/lib/hebrewNormalize";

// Use ONLY Blob CDN URLs — never fall back to Monday proxy
// Monday proxy burns daily API limit and causes ALL images to break
function getBestImageUrl(blobUrl: string | null, _mondayUrl: string | null): string | null {
  return blobUrl || null;
}

function getBestImageUrls(blobUrls: string[], _mondayUrls: string[]): string[] {
  if (blobUrls.length > 0) return blobUrls;
  return [];
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
    const plateModel = searchParams.get("plateModel"); // Model from plate lookup (flexible matching)
    const year = searchParams.get("year");
    const position = searchParams.get("position");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const isPlateSearch = searchParams.get("plateSearch") === "1";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(5000, Math.max(1, parseInt(searchParams.get("limit") || "24", 10)));

    const where: Prisma.BumperCacheWhereInput = {};

    if (make) {
      // Search for all geresh variants (צ'רי, צרי, etc.)
      const normalizedMake = normalizeHebrew(make);
      // Find all DB makes that match when normalized
      const allMakes = await prisma.bumperCache.findMany({
        select: { carMake: true },
        distinct: ["carMake"],
      });
      const matchingMakes = allMakes
        .map((m) => m.carMake)
        .filter((m) => normalizeHebrew(m) === normalizedMake);

      if (matchingMakes.length > 1) {
        where.carMake = { in: matchingMakes };
      } else {
        where.carMake = matchingMakes[0] || make;
      }
    }
    if (model) {
      // Normalize and use "contains" matching for model
      // e.g. searching "A CLASS" should find "A CLASS", "A CLASS 176", "A CLASS W177", etc.
      const normalizedModel = normalizeHebrew(model);
      const allModels = await prisma.bumperCache.findMany({
        select: { carModel: true },
        distinct: ["carModel"],
        where: where.carMake ? { carMake: where.carMake as Prisma.StringFilter | string } : undefined,
      });
      const matchingModels = allModels
        .map((m) => m.carModel)
        .filter((m) => {
          const norm = normalizeHebrew(m);
          // Exact match, starts with, or contains the search model
          // "a class" matches "a class", "a class 176", "a class amg 177", "a class w169"
          return (
            norm === normalizedModel ||
            norm.startsWith(normalizedModel + " ") ||
            norm.startsWith(normalizedModel + "/") ||
            norm.includes(" " + normalizedModel + " ") ||
            norm.includes(" " + normalizedModel)
          );
        });

      if (matchingModels.length > 1) {
        where.carModel = { in: matchingModels };
      } else if (matchingModels.length === 1) {
        where.carModel = matchingModels[0];
      } else {
        // Fallback: use contains search
        where.carModel = { contains: model, mode: "insensitive" };
      }
    }
    // Plate search: flexible model matching — find model + variants
    // e.g. "מודל 3" should also find "3 היילנד", "מודל 3 פרפורמנס" etc.
    if (!model && plateModel && isPlateSearch) {
      const normalizedPlateModel = normalizeHebrew(plateModel);
      const allModels = await prisma.bumperCache.findMany({
        select: { carModel: true },
        distinct: ["carModel"],
        where: where.carMake ? { carMake: where.carMake as Prisma.StringFilter | string } : undefined,
      });

      // Extract key words from the model name (e.g. "מודל 3" → ["מודל", "3"], or just "3")
      const modelWords = normalizedPlateModel.split(/\s+/);
      const keyNumber = modelWords.find(w => /^\d+$/.test(w)); // e.g. "3" from "מודל 3"

      const matchingModels = allModels
        .map((m) => m.carModel)
        .filter((m) => {
          const norm = normalizeHebrew(m);
          // Exact match
          if (norm === normalizedPlateModel) return true;
          // Starts with the model name
          if (norm.startsWith(normalizedPlateModel + " ") || norm.startsWith(normalizedPlateModel + "/")) return true;
          // Contains the model name
          if (norm.includes(" " + normalizedPlateModel)) return true;
          // If there's a key number (e.g. "3"), match models containing that number
          // "3 היילנד" contains "3", "מודל 3" contains "3"
          if (keyNumber && (norm.includes(keyNumber + " ") || norm.endsWith(keyNumber) || norm.startsWith(keyNumber + " "))) return true;
          return false;
        });

      if (matchingModels.length > 0) {
        where.carModel = { in: matchingModels };
      }
    }
    // Year filtering is handled post-query via doesYearMatch
    // For plate search, also show nearby years (±2)
    const filterByYear = year ? parseInt(year) : null;
    const isPlateYearSearch = isPlateSearch && filterByYear;
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

    if (filterByYear && !isNaN(filterByYear)) {
      // Year filtering requires in-memory matching against ranges
      // Fetch all matching bumpers (without pagination), filter by year, then paginate
      const allRaw = await prisma.bumperCache.findMany({
        where,
        orderBy: { lastSynced: "desc" },
      });

      let yearFiltered;
      if (isPlateYearSearch) {
        // For plate search: show bumpers matching the exact year OR nearby years (±2)
        yearFiltered = allRaw.filter((b) => {
          for (let y = filterByYear - 2; y <= filterByYear + 2; y++) {
            if (doesYearMatch(b.carYear, y)) return true;
          }
          return false;
        });
      } else {
        yearFiltered = allRaw.filter((b) =>
          doesYearMatch(b.carYear, filterByYear)
        );
      }

      // Sort: bumpers with blob images first
      yearFiltered.sort((a, b) => {
        const aHasImg = a.blobImageUrl ? 0 : 1;
        const bHasImg = b.blobImageUrl ? 0 : 1;
        return aHasImg - bHasImg;
      });

      const total = yearFiltered.length;
      const paged = yearFiltered.slice((page - 1) * limit, page * limit);

      const bumpers = paged.map((b) => ({
        ...b,
        imageUrl: getBestImageUrl(b.blobImageUrl, b.imageUrl),
        imageUrls: getBestImageUrls(b.blobImageUrls, b.imageUrls),
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
    }

    // No year filter — standard DB pagination
    // Order: bumpers with blob images first, then by lastSynced
    // Use two-query approach because Prisma nulls ordering doesn't handle empty strings
    const withImagesWhere: Prisma.BumperCacheWhereInput = {
      AND: [where, { blobImageUrl: { not: null } }],
    };
    const noImagesWhere: Prisma.BumperCacheWhereInput = {
      AND: [where, { blobImageUrl: null }],
    };

    const [total, withImagesCount] = await Promise.all([
      prisma.bumperCache.count({ where }),
      prisma.bumperCache.count({ where: withImagesWhere }),
    ]);

    const skip = (page - 1) * limit;
    let rawBumpers;

    if (skip < withImagesCount) {
      // This page starts within items that have images
      const withImages = await prisma.bumperCache.findMany({
        where: withImagesWhere,
        skip,
        take: limit,
        orderBy: { lastSynced: "desc" },
      });

      if (withImages.length < limit) {
        // Fill remaining slots with items without images
        const remaining = limit - withImages.length;
        const noImages = await prisma.bumperCache.findMany({
          where: noImagesWhere,
          take: remaining,
          orderBy: { lastSynced: "desc" },
        });
        rawBumpers = [...withImages, ...noImages];
      } else {
        rawBumpers = withImages;
      }
    } else {
      // Past all items with images — fetch from no-image set
      const noImagesSkip = skip - withImagesCount;
      rawBumpers = await prisma.bumperCache.findMany({
        where: noImagesWhere,
        skip: noImagesSkip,
        take: limit,
        orderBy: { lastSynced: "desc" },
      });
    }

    // Transform protected Monday URLs to proxy URLs and normalize status
    const bumpers = rawBumpers.map((b) => ({
      ...b,
      imageUrl: getBestImageUrl(b.blobImageUrl, b.imageUrl),
      imageUrls: getBestImageUrls(b.blobImageUrls, b.imageUrls),
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
