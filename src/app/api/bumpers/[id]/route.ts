import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Transform protected Monday.com URLs to proxy URLs
function transformImageUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("/api/images/monday/")) return url;
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

    // Prefer blob URLs, fallback to Monday proxy
    const transformed = {
      ...bumper,
      imageUrl: bumper.blobImageUrl || transformImageUrl(bumper.imageUrl),
      imageUrls: bumper.blobImageUrls.length > 0
        ? bumper.blobImageUrls
        : bumper.imageUrls.map((url) => transformImageUrl(url) || url),
      status: normalizeStatus(bumper.status),
    };

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Error fetching bumper:", error);
    return NextResponse.json(
      { error: "Failed to fetch bumper" },
      { status: 500 }
    );
  }
}
