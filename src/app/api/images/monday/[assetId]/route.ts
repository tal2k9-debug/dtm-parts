export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const { assetId } = await params;

    if (!assetId || !/^\d+$/.test(assetId)) {
      return new Response("Invalid asset ID", { status: 400 });
    }

    const apiKey = process.env.MONDAY_API_KEY;
    if (!apiKey) {
      return new Response("API key missing", { status: 500 });
    }

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
      return new Response("Asset not found", { status: 404 });
    }

    return Response.redirect(publicUrl, 302);
  } catch (err) {
    console.error("Image proxy error:", err);
    return new Response("Error", { status: 500 });
  }
}
