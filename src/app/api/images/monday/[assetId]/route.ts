export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const { assetId } = await params;

  if (!assetId || !/^\d+$/.test(assetId)) {
    return Response.json({ error: "Invalid asset ID" }, { status: 400 });
  }

  const apiKey = process.env.MONDAY_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "No API key", hasKey: false }, { status: 500 });
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

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return Response.json({ error: "Invalid JSON from Monday", body: text.substring(0, 200) }, { status: 502 });
    }

    const publicUrl = data?.data?.assets?.[0]?.public_url;

    if (!publicUrl) {
      return Response.json({
        error: "No public_url",
        mondayResponse: data,
        assetId
      }, { status: 404 });
    }

    // Use NextResponse-style redirect
    return new Response(null, {
      status: 307,
      headers: {
        Location: publicUrl,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message, assetId }, { status: 500 });
  }
}
