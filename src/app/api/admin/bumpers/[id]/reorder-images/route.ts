import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// PUT - set primary image by moving it to index 0
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { primaryIndex, imageUrl } = body;

  const bumper = await prisma.bumperCache.findUnique({ where: { id } });
  if (!bumper) {
    return NextResponse.json({ error: "פגוש לא נמצא" }, { status: 404 });
  }

  // Reorder imageUrls - move selected to front
  const reorder = (arr: string[], idx: number): string[] => {
    if (idx < 0 || idx >= arr.length) return arr;
    const item = arr[idx];
    const rest = [...arr.slice(0, idx), ...arr.slice(idx + 1)];
    return [item, ...rest];
  };

  // Find the actual index in the DB by URL (more reliable than client index)
  let actualIndex = primaryIndex;
  if (imageUrl) {
    // Try to find in blobImageUrls first, then imageUrls
    const blobIdx = bumper.blobImageUrls.findIndex((u) => u === imageUrl);
    const imgIdx = bumper.imageUrls.findIndex((u) => u === imageUrl);
    actualIndex = blobIdx >= 0 ? blobIdx : imgIdx >= 0 ? imgIdx : primaryIndex;
  }

  if (typeof actualIndex !== "number" || actualIndex < 0) {
    return NextResponse.json({ error: "חסר primaryIndex" }, { status: 400 });
  }

  const newImageUrls = reorder(bumper.imageUrls, actualIndex);
  const newBlobImageUrls = reorder(bumper.blobImageUrls, actualIndex);

  // Also update imageUrl and blobImageUrl to match new first item
  const updated = await prisma.bumperCache.update({
    where: { id },
    data: {
      imageUrls: newImageUrls,
      imageUrl: newImageUrls[0] || bumper.imageUrl,
      blobImageUrls: newBlobImageUrls,
      blobImageUrl: newBlobImageUrls[0] || bumper.blobImageUrl,
    },
  });

  return NextResponse.json({
    success: true,
    imageUrls: updated.imageUrls,
    blobImageUrls: updated.blobImageUrls,
  });
}
