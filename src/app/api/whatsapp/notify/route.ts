import { NextResponse } from "next/server";
import { notifyAdmin } from "@/lib/whatsapp";

// POST /api/whatsapp/notify — Send WhatsApp notification to admin
export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const result = await notifyAdmin(message);

    return NextResponse.json({
      success: true,
      messageSid: result?.sid || "skipped",
    });
  } catch (error) {
    console.error("WhatsApp notify error:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
