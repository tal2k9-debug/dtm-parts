import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// In-memory cache for resolved URLs (lasts until serverless function cold-starts)
const urlCache = new Map<string, { url: string; expiresAt: number }>();
const CACHE_TTL = 55 * 60 * 1000; // 55 minutes (Monday signed URLs expire after 1 hour)

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const { assetId } = await params;

  if (!assetId || !/^\d+$/.test(assetId)) {
    return Response.json({ error: "Invalid asset ID" }, { status: 400 });
  }

  // 0. Check for permanent Blob URL (never expires)
  try {
    const blobCache = await prisma.imageCache.findUnique({
      where: { assetId },
      select: { blobUrl: true },
    });
    if (blobCache?.blobUrl) {
      return new Response(null, {
        status: 307,
        headers: {
          Location: blobCache.blobUrl,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  } catch {
    // Continue to other caches
  }

  // 1. Check in-memory cache first (fastest)
  const cached = urlCache.get(assetId);
  if (cached && cached.expiresAt > Date.now()) {
    return new Response(null, {
      status: 307,
      headers: {
        Location: cached.url,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // 2. Check database cache (persistent across cold starts)
  try {
    const dbCache = await prisma.imageCache.findUnique({
      where: { assetId },
    });

    if (dbCache && dbCache.expiresAt > new Date()) {
      // Save to memory cache too
      urlCache.set(assetId, { url: dbCache.publicUrl, expiresAt: dbCache.expiresAt.getTime() });
      return new Response(null, {
        status: 307,
        headers: {
          Location: dbCache.publicUrl,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  } catch {
    // DB cache miss or error, continue to Monday API
  }

  // 3. Fetch from Monday API
  const apiKey = process.env.MONDAY_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "No API key" }, { status: 500 });
  }

  try {
    const response = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({
        query: `{ assets(ids: [${assetId}]) { public_url } }`,
      }),
    });

    const data = await response.json();
    const publicUrl = data?.data?.assets?.[0]?.public_url;

    if (!publicUrl) {
      // If daily limit exceeded, return a placeholder
      if (data?.errors?.[0]?.extensions?.code === "DAILY_LIMIT_EXCEEDED") {
        return new Response(null, {
          status: 307,
          headers: {
            Location: "/images/bumper-placeholder.svg",
            "Cache-Control": "public, max-age=300", // retry in 5 min
          },
        });
      }
      return Response.json({ error: "No public_url", assetId }, { status: 404 });
    }

    // 4. Save to both caches
    const expiresAt = new Date(Date.now() + CACHE_TTL);
    urlCache.set(assetId, { url: publicUrl, expiresAt: expiresAt.getTime() });

    try {
      await prisma.imageCache.upsert({
        where: { assetId },
        create: { assetId, publicUrl, expiresAt },
        update: { publicUrl, expiresAt },
      });
    } catch {
      // Non-blocking: if DB save fails, memory cache still works
    }

    return new Response(null, {
      status: 307,
      headers: {
        Location: publicUrl,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message, assetId }, { status: 500 });
  }
}
