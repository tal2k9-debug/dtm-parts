const MONDAY_API_URL = "https://api.monday.com/v2";
const BUMPERS_BOARD_ID = "3928998531";

interface MondayColumnValue {
  id: string;
  text: string | null;
  value: string | null;
  type: string;
}

interface MondayItem {
  id: string;
  name: string;
  column_values: MondayColumnValue[];
  assets?: { id: string; public_url: string }[];
}

export interface ImageAsset {
  assetId: string;
  publicUrl: string; // direct download URL (valid ~1 hour)
}

export interface MondayBumper {
  mondayItemId: string;
  catalogNumber: string;
  carMake: string;
  carModel: string;
  carYear: string;
  position: "FRONT" | "REAR" | null;
  color: string;
  condition: string;
  status: string; // "במלאי" / "אזל" (mapped from Monday "כן"/"לא")
  imageUrls: string[];
  imageAssets: ImageAsset[]; // asset IDs + download URLs for Blob upload
}

function getColumnText(item: MondayItem, columnId: string): string {
  const col = item.column_values.find((c) => c.id === columnId);
  return col?.text?.trim() || "";
}

function getFileUrls(item: MondayItem): string[] {
  const fileCol = item.column_values.find((c) => c.id === "file6");
  if (!fileCol) return [];

  // Try parsing JSON value first (has assetId)
  if (fileCol.value) {
    try {
      const parsed = JSON.parse(fileCol.value);
      // Structure: { files: [{ assetId: number, ... }] }
      if (parsed?.files && Array.isArray(parsed.files)) {
        const proxyUrls = parsed.files
          .filter((f: { assetId?: number }) => f.assetId)
          .map(
            (f: { assetId: number }) =>
              `/api/images/monday/${f.assetId}`
          );
        if (proxyUrls.length > 0) return proxyUrls;
      }
    } catch {
      // fall through to text/assets fallback
    }
  }

  // Fallback: use item assets if available (public_url from Monday API)
  if (item.assets && item.assets.length > 0) {
    return item.assets
      .map((a) => a.public_url)
      .filter((url) => !!url);
  }

  // Last resort: extract resource IDs from protected_static URLs and proxy them
  if (fileCol.text) {
    const urls = fileCol.text
      .split(",")
      .map((url: string) => url.trim())
      .filter((url: string) => url.startsWith("http"));

    // Try to extract resource IDs from Monday protected URLs
    // Pattern: /protected_static/{accountId}/resources/{resourceId}/filename
    const proxyUrls = urls
      .map((url: string) => {
        const match = url.match(/\/resources\/(\d+)\//);
        if (match) {
          return `/api/images/monday/${match[1]}`;
        }
        return url; // keep as-is if pattern doesn't match
      });

    return proxyUrls;
  }

  return [];
}

// Extract image assets with both assetId and publicUrl for Blob upload
function getImageAssets(item: MondayItem): ImageAsset[] {
  const fileCol = item.column_values.find((c) => c.id === "file6");

  // Get asset IDs from file column JSON
  const assetIds = new Set<string>();
  if (fileCol?.value) {
    try {
      const parsed = JSON.parse(fileCol.value);
      if (parsed?.files && Array.isArray(parsed.files)) {
        for (const f of parsed.files) {
          if (f.assetId) assetIds.add(String(f.assetId));
        }
      }
    } catch { /* ignore */ }
  }

  // Match asset IDs with public_urls from item.assets
  if (item.assets && item.assets.length > 0) {
    // If we have asset IDs from column, match them in order
    if (assetIds.size > 0) {
      return item.assets
        .filter((a) => a.public_url && assetIds.has(String(a.id)))
        .map((a) => ({ assetId: String(a.id), publicUrl: a.public_url }));
    }
    // Otherwise use all assets
    return item.assets
      .filter((a) => a.public_url)
      .map((a) => ({ assetId: String(a.id), publicUrl: a.public_url }));
  }

  return [];
}

function mapPosition(text: string): "FRONT" | "REAR" | null {
  if (text === "קדמי") return "FRONT";
  if (text === "אחורי") return "REAR";
  return null;
}

function mapStatus(text: string): string {
  // Monday column uses "כן"/"לא" but we display "במלאי"/"אזל"
  if (text === "כן") return "במלאי";
  if (text === "לא") return "אזל";
  // Pass through any other values (e.g., "בהזמנה" if added later)
  return text || "אזל";
}

export async function fetchBumpersFromMonday(): Promise<MondayBumper[]> {
  const apiKey = process.env.MONDAY_API_KEY;
  if (!apiKey) throw new Error("MONDAY_API_KEY is not set");

  const allItems: MondayItem[] = [];
  let cursor: string | null = null;
  let hasMore = true;

  // First request - include assets for image public URLs
  const firstQuery = `{
    boards(ids: [${BUMPERS_BOARD_ID}]) {
      items_page(limit: 500) {
        cursor
        items {
          id
          name
          column_values {
            id
            text
            value
            type
          }
          assets {
            id
            public_url
          }
        }
      }
    }
  }`;

  const firstRes = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query: firstQuery }),
  });

  const firstData = await firstRes.json();
  const firstPage = firstData?.data?.boards?.[0]?.items_page;
  if (firstPage?.items) {
    allItems.push(...firstPage.items);
    cursor = firstPage.cursor;
  }

  // Paginate
  while (cursor) {
    const nextQuery = `{
      next_items_page(limit: 500, cursor: "${cursor}") {
        cursor
        items {
          id
          name
          column_values {
            id
            text
            value
            type
          }
          assets {
            id
            public_url
          }
        }
      }
    }`;

    const nextRes = await fetch(MONDAY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({ query: nextQuery }),
    });

    const nextData = await nextRes.json();
    const nextPage = nextData?.data?.next_items_page;
    if (nextPage?.items?.length) {
      allItems.push(...nextPage.items);
      cursor = nextPage.cursor;
    } else {
      cursor = null;
    }
  }

  // Map to our format
  return allItems.map((item) => ({
    mondayItemId: item.id,
    catalogNumber: item.name,
    carMake: getColumnText(item, "text"),
    carModel: getColumnText(item, "text0"),
    carYear: getColumnText(item, "text5"),
    position: mapPosition(getColumnText(item, "color")),
    color: getColumnText(item, "text4"),
    condition: getColumnText(item, "text6"),
    status: mapStatus(getColumnText(item, "color_mkwzjzja")),
    imageUrls: getFileUrls(item),
    imageAssets: getImageAssets(item),
  }));
}

export async function fetchSingleBumperFromMonday(itemId: string): Promise<MondayBumper | null> {
  const apiKey = process.env.MONDAY_API_KEY;
  if (!apiKey) throw new Error("MONDAY_API_KEY is not set");

  const query = `{
    items(ids: [${itemId}]) {
      id
      name
      column_values {
        id
        text
        value
        type
      }
      assets {
        id
        public_url
      }
    }
  }`;

  const res = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();
  const item = data?.data?.items?.[0];
  if (!item) return null;

  return {
    mondayItemId: item.id,
    catalogNumber: item.name,
    carMake: getColumnText(item, "text"),
    carModel: getColumnText(item, "text0"),
    carYear: getColumnText(item, "text5"),
    position: mapPosition(getColumnText(item, "color")),
    color: getColumnText(item, "text4"),
    condition: getColumnText(item, "text6"),
    status: mapStatus(getColumnText(item, "color_mkwzjzja")),
    imageUrls: getFileUrls(item),
    imageAssets: getImageAssets(item),
  };
}

/**
 * Smart sync: fetch only items that changed since last sync.
 * Uses board activity log to find changed item IDs, then fetches only those items.
 * This saves ~90% of API complexity compared to full sync.
 */
export async function fetchChangedBumpersFromMonday(sinceDate: Date): Promise<{
  changedItems: MondayBumper[];
  changedIds: string[];
}> {
  const apiKey = process.env.MONDAY_API_KEY;
  if (!apiKey) throw new Error("MONDAY_API_KEY is not set");

  // Step 1: Get activity log to find changed items (very low complexity)
  const sinceStr = sinceDate.toISOString().split(".")[0] + "Z";
  const activityQuery = `{
    boards(ids: [${BUMPERS_BOARD_ID}]) {
      activity_logs(from: "${sinceStr}", limit: 500) {
        data
        event
        entity
      }
    }
  }`;

  const activityRes = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: apiKey },
    body: JSON.stringify({ query: activityQuery }),
  });

  const activityData = await activityRes.json();

  if (activityData?.errors) {
    console.error("Monday activity API error:", activityData.errors);
    throw new Error(activityData.errors[0]?.message || "Monday API error");
  }

  const logs = activityData?.data?.boards?.[0]?.activity_logs || [];

  // Extract unique item IDs from activity
  const changedIds = new Set<string>();
  for (const log of logs) {
    try {
      const data = typeof log.data === "string" ? JSON.parse(log.data) : log.data;
      if (data?.pulse_id) changedIds.add(String(data.pulse_id));
      if (data?.item_id) changedIds.add(String(data.item_id));
    } catch {
      // Skip unparseable entries
    }
  }

  if (changedIds.size === 0) {
    return { changedItems: [], changedIds: [] };
  }

  // Step 2: Fetch only the changed items (much lower complexity)
  const ids = [...changedIds];
  const allItems: MondayItem[] = [];

  // Batch fetch in groups of 100
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100);
    const query = `{
      items(ids: [${batch.join(",")}]) {
        id
        name
        column_values {
          id
          text
          value
          type
        }
      }
    }`;

    const res = await fetch(MONDAY_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: apiKey },
      body: JSON.stringify({ query }),
    });

    const data = await res.json();
    if (data?.errors) {
      console.error("Monday items API error:", data.errors);
      throw new Error(data.errors[0]?.message || "Monday API error");
    }

    const items = data?.data?.items || [];
    allItems.push(...items);
  }

  const changedItems = allItems.map((item) => ({
    mondayItemId: item.id,
    catalogNumber: item.name,
    carMake: getColumnText(item, "text"),
    carModel: getColumnText(item, "text0"),
    carYear: getColumnText(item, "text5"),
    position: mapPosition(getColumnText(item, "color")),
    color: getColumnText(item, "text4"),
    condition: getColumnText(item, "text6"),
    status: mapStatus(getColumnText(item, "color_mkwzjzja")),
    imageUrls: getFileUrls(item),
    imageAssets: getImageAssets(item),
  }));

  return { changedItems, changedIds: ids };
}

export async function fetchBumperAssetUrl(assetId: number): Promise<string | null> {
  const apiKey = process.env.MONDAY_API_KEY;
  if (!apiKey) return null;

  const query = `{ assets(ids: [${assetId}]) { public_url } }`;

  const res = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();
  return data?.data?.assets?.[0]?.public_url || null;
}
