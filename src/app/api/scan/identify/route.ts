import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  // Admin only
  const session = await getServerSession(authOptions);
  const role = (session?.user as Record<string, unknown>)?.role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "חסרה תמונה" }, { status: 400 });
    }

    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const mediaType = imageBase64.startsWith("data:image/webp") ? "image/webp" : "image/jpeg";

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as "image/webp" | "image/jpeg" | "image/png" | "image/gif",
                data: base64Data,
              },
            },
            {
              type: "text",
              text: `אתה מומחה לזיהוי חלקי רכב, במיוחד פגושים (טמבונים/מגנים).

נתח את התמונה וזהה:
1. יצרן הרכב (בעברית, למשל: טויוטה, יונדאי, מרצדס, קיה)
2. דגם הרכב (בעברית, למשל: קורולה, טוסון, ספורטאז)
3. טווח שנים משוער (למשל: 2018-2021)
4. מיקום: קדמי או אחורי

החזר JSON בלבד, בלי טקסט נוסף:
{
  "manufacturer": "יצרן בעברית",
  "model": "דגם בעברית",
  "yearFrom": 2018,
  "yearTo": 2021,
  "position": "front" או "rear",
  "confidence": "high" או "medium" או "low"
}

אם אתה לא בטוח, העדף confidence: "low" ותן את הניחוש הטוב ביותר שלך.
אם אתה לא מצליח לזהות בכלל, החזר: { "error": "לא ניתן לזהות" }`,
            },
          ],
        },
      ],
    });

    // Extract JSON from response
    const textContent = response.content.find((c: { type: string }) => c.type === "text") as { type: "text"; text: string } | undefined;
    if (!textContent) {
      return NextResponse.json({ identified: false });
    }

    try {
      // Try to parse JSON from the response
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        if (result.error) {
          return NextResponse.json({ identified: false });
        }
        return NextResponse.json({
          identified: true,
          manufacturer: result.manufacturer,
          model: result.model,
          yearFrom: result.yearFrom,
          yearTo: result.yearTo,
          position: result.position === "front" ? "FRONT" : "REAR",
          confidence: result.confidence || "medium",
        });
      }
    } catch {
      // JSON parse failed
    }

    return NextResponse.json({ identified: false });
  } catch (error) {
    console.error("AI identification error:", error);
    return NextResponse.json({ identified: false });
  }
}
