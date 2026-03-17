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
  assets?: { public_url: string }[];
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
  status: string; // "כן" = in stock
  imageUrls: string[];
}

function getColumnText(item: MondayItem, columnId: string): string {
  const col = item.column_values.find((c) => c.id === columnId);
  return col?.text?.trim() || "";
}

function getFileUrls(item: MondayItem): string[] {
  const fileCol = item.column_values.find((c) => c.id === "file6");
  if (!fileCol?.value) return [];

  try {
    const parsed = JSON.parse(fileCol.value);
    if (parsed?.files) {
      return parsed.files.map(
        (f: { assetId: number }) =>
          `/api/images/monday/${f.assetId}`
      );
    }
  } catch {
    // fallback: extract URLs from text
    if (fileCol.text) {
      return fileCol.text
        .split(",")
        .map((url: string) => url.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function mapPosition(text: string): "FRONT" | "REAR" | null {
  if (text === "קדמי") return "FRONT";
  if (text === "אחורי") return "REAR";
  return null;
}

export async function fetchBumpersFromMonday(): Promise<MondayBumper[]> {
  const apiKey = process.env.MONDAY_API_KEY;
  if (!apiKey) throw new Error("MONDAY_API_KEY is not set");

  const allItems: MondayItem[] = [];
  let cursor: string | null = null;
  let hasMore = true;

  // First request
  const firstQuery = `{
    boards(ids: [${BUMPERS_BOARD_ID}]) {
      items_page(limit: 100) {
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
      next_items_page(limit: 100, cursor: "${cursor}") {
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
    status: getColumnText(item, "color_mkwzjzja"),
    imageUrls: getFileUrls(item),
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
    status: getColumnText(item, "color_mkwzjzja"),
    imageUrls: getFileUrls(item),
  };
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
