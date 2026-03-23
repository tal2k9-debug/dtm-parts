import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const MONDAY_API_KEY = process.env.MONDAY_API_KEY!;
const BUMPERS_BOARD_ID = "3928998531";

async function mondayQuery(query: string, variables?: Record<string, unknown>) {
  const res = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: MONDAY_API_KEY,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

async function getNextItemNumber(): Promise<string> {
  // Get the highest item number from the board
  const query = `{
    boards(ids: [${BUMPERS_BOARD_ID}]) {
      items_page(limit: 1, query_params: { order_by: { column_id: "name", direction: desc } }) {
        items { name }
      }
    }
  }`;
  const data = await mondayQuery(query);
  const items = data?.data?.boards?.[0]?.items_page?.items;
  if (items && items.length > 0) {
    const lastNum = parseInt(items[0].name);
    if (!isNaN(lastNum)) {
      return (lastNum + 1).toString();
    }
  }
  return "12000"; // Default start number
}

async function uploadImageToMonday(
  itemId: string,
  imageBase64: string,
  index: number
): Promise<boolean> {
  try {
    // Convert base64 to buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const ext = imageBase64.startsWith("data:image/webp") ? "webp" : "jpg";
    const filename = `bumper_${index + 1}.${ext}`;

    // Monday file upload requires multipart form
    const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
    const query = `mutation ($file: File!) { add_file_to_column (item_id: ${itemId}, column_id: "file6", file: $file) { id } }`;

    const formParts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="query"\r\n\r\n${query}`,
      `--${boundary}\r\nContent-Disposition: form-data; name="variables[file]"; filename="${filename}"\r\nContent-Type: image/${ext}\r\n\r\n`,
    ];

    const bodyParts = [
      Buffer.from(formParts[0] + "\r\n"),
      Buffer.from(formParts[1]),
      buffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ];
    const body = Buffer.concat(bodyParts);

    const res = await fetch("https://api.monday.com/v2/file", {
      method: "POST",
      headers: {
        Authorization: MONDAY_API_KEY,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body,
    });

    const result = await res.json();
    return !result.errors;
  } catch (e) {
    console.error("Image upload error:", e);
    return false;
  }
}

export async function POST(request: NextRequest) {
  // Admin only
  const session = await getServerSession(authOptions);
  const role = (session?.user as Record<string, unknown>)?.role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { make, model, yearFrom, yearTo, position, condition, color, price, notes, photos } = body;

    // Get next item number
    const itemNumber = await getNextItemNumber();

    // Build year text
    const yearText =
      yearFrom && yearTo
        ? yearFrom === yearTo
          ? `${yearFrom}`
          : `${yearFrom}-${yearTo}`
        : yearFrom
        ? `${yearFrom}+`
        : "";

    // Build column values
    const positionLabel = position === "FRONT" ? "קדמי" : "אחורי";
    const conditionNotes = [condition, notes].filter(Boolean).join(" | ");

    const columnValues = JSON.stringify({
      text: make,
      text0: model,
      text5: yearText,
      text_mm1h8ypw: yearFrom ? yearFrom.toString() : "",
      text_mm1hwyn2: yearTo ? yearTo.toString() : "",
      color_mkwzjzja: { label: "כן" },
      color: { label: positionLabel },
      text4: color || "",
      text6: conditionNotes || "",
      numeric_mm1mnv69: price ? price.toString() : "",
    });

    // Create item
    const createQuery = `mutation {
      create_item(
        board_id: ${BUMPERS_BOARD_ID},
        item_name: "${itemNumber}",
        column_values: ${JSON.stringify(columnValues)}
      ) {
        id
        name
      }
    }`;

    const result = await mondayQuery(createQuery);

    if (result.errors) {
      console.error("Monday create error:", result.errors);
      return NextResponse.json(
        { error: "שגיאה ביצירת הפריט ב-Monday" },
        { status: 500 }
      );
    }

    const itemId = result.data?.create_item?.id;
    const itemName = result.data?.create_item?.name;

    // Upload photos (first 8)
    if (photos && photos.length > 0 && itemId) {
      const photosToUpload = photos.slice(0, 8);
      for (let i = 0; i < photosToUpload.length; i++) {
        await uploadImageToMonday(itemId, photosToUpload[i], i);
        // Small delay between uploads
        if (i < photosToUpload.length - 1) {
          await new Promise((r) => setTimeout(r, 300));
        }
      }
    }

    return NextResponse.json({
      success: true,
      itemId,
      itemNumber: itemName,
      message: `פריט ${itemName} נוצר בהצלחה!`,
    });
  } catch (error) {
    console.error("Create item error:", error);
    return NextResponse.json(
      { error: "שגיאה ביצירת הפריט" },
      { status: 500 }
    );
  }
}
