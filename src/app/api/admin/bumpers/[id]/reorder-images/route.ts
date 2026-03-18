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
  const { primaryIndex } = body;

  if (typeof primaryIndex !== "number") {
    return NextResponse.json({ error: "חסר primaryIndex" }, { status: 400 });
  }

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

  const newImageUrls = reorder(bumper.imageUrls, primaryIndex);
  const newBlobImageUrls = reorder(bumper.blobImageUrls, primaryIndex);

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
