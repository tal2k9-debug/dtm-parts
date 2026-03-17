import { NextResponse } from "next/server";

export const runtime = "edge";

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

    // Redirect to the signed S3 URL
    return new Response(null, {
      status: 302,
      headers: {
        Location: publicUrl,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch asset" },
      { status: 500 }
    );
  }
}
