import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const { assetId } = await params;

  if (!assetId || !/^\d+$/.test(assetId)) {
    return NextResponse.json({ error: "Invalid asset ID" }, { status: 400 });
  }

  const apiKey = process.env.MONDAY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Monday API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Get signed URL from Monday
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

    if (!response.ok) {
      return NextResponse.json(
        { error: "Monday API request failed" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const publicUrl = data?.data?.assets?.[0]?.public_url;

    if (!publicUrl) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Fetch the actual image and stream it back
    const imageResponse = await fetch(publicUrl);
    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Image fetch failed" }, { status: 502 });
    }

    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const imageBuffer = await imageResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch asset" },
      { status: 500 }
    );
  }
}
