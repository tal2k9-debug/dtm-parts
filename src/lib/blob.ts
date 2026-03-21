import { put } from "@vercel/blob";
import sharp from "sharp";

/**
 * Download image, compress to WebP 80% at max 800px width,
 * and upload to Vercel Blob.
 * Returns the permanent public Blob URL.
 */
export async function uploadImageToBlob(
  assetId: string,
  imageBuffer: Buffer
): Promise<string> {
  // Compress: resize to max 800px width, convert to WebP 80%
  const compressed = await sharp(imageBuffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const { url } = await put(`bumpers/${assetId}.webp`, compressed, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "image/webp",
  });

  return url;
}

/**
 * Resolve a Monday asset ID to a signed download URL.
 * Uses Monday GraphQL API.
 */
export async function resolveAssetUrl(
  assetId: string,
  apiKey: string
): Promise<string | null> {
  const response = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
      "API-Version": "2024-10",
    },
    body: JSON.stringify({
      query: `query { assets(ids: [${assetId}]) { public_url } }`,
    }),
  });

  const data = await response.json();

  if (data.errors) {
    const errMsg = data.errors[0]?.message || "";
    if (errMsg.includes("DAILY_LIMIT_EXCEEDED")) {
      throw new Error("DAILY_LIMIT_EXCEEDED");
    }
    throw new Error(`Monday API error: ${errMsg}`);
  }

  const assets = data.data?.assets;
  if (assets && assets.length > 0 && assets[0].public_url) {
    return assets[0].public_url;
  }

  return null;
}

/**
 * Resolve multiple Monday asset IDs in a single API call.
 * Returns a map of assetId -> public_url.
 */
export async function resolveAssetUrlsBatch(
  assetIds: string[],
  apiKey: string
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (assetIds.length === 0) return result;

  const idsStr = assetIds.join(",");
  const response = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
      "API-Version": "2024-10",
    },
    body: JSON.stringify({
      query: `query { assets(ids: [${idsStr}]) { id public_url } }`,
    }),
  });

  const data = await response.json();

  if (data.errors) {
    const errMsg = data.errors[0]?.message || "";
    if (errMsg.includes("DAILY_LIMIT_EXCEEDED")) {
      throw new Error("DAILY_LIMIT_EXCEEDED");
    }
    throw new Error(`Monday API error: ${errMsg}`);
  }

  const assets = data.data?.assets || [];
  for (const asset of assets) {
    if (asset.id && asset.public_url) {
      result.set(String(asset.id), asset.public_url);
    }
  }

  return result;
}

/**
 * Download an image from a URL and return its buffer.
 */
export async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Extract asset ID from proxy URL format: /api/images/monday/{assetId}
 */
export function extractAssetId(proxyUrl: string): string | null {
  const match = proxyUrl.match(/\/api\/images\/monday\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Check if a blob image is valid (not broken/too small).
 * A valid WebP image should be at least 2KB.
 */
export async function isBlobImageValid(blobUrl: string): Promise<boolean> {
  try {
    const res = await fetch(blobUrl, { method: "HEAD" });
    if (!res.ok) return false;
    const contentLength = parseInt(res.headers.get("content-length") || "0", 10);
    // Images under 2KB are almost certainly broken/placeholder
    return contentLength > 2000;
  } catch {
    return false;
  }
}
