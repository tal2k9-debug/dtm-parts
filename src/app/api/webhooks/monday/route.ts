import { NextResponse } from "next/server";
import { fetchSingleBumperFromMonday } from "@/lib/monday";
import { prisma } from "@/lib/prisma";

// POST /api/webhooks/monday — Webhook handler for Monday.com status changes
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Monday.com sends a challenge on webhook setup
    if (body.challenge) {
      return NextResponse.json({ challenge: body.challenge });
    }

    // Handle the webhook event
    const event = body.event;
    if (!event) {
      return NextResponse.json({ error: "No event data" }, { status: 400 });
    }

    const itemId = String(event.pulseId || event.itemId);
    if (!itemId) {
      return NextResponse.json({ error: "No item ID in event" }, { status: 400 });
    }

    console.log(`Monday webhook: item ${itemId} changed (column: ${event.columnId})`);

    // Fetch the updated item from Monday and upsert into BumperCache
    const bumper = await fetchSingleBumperFromMonday(itemId);

    if (bumper) {
      await prisma.bumperCache.upsert({
        where: { mondayItemId: bumper.mondayItemId },
        update: {
          name: bumper.catalogNumber,
          carMake: bumper.carMake,
          carModel: bumper.carModel,
          carYear: bumper.carYear,
          position: bumper.position,
          price: null,
          status: bumper.status,
          imageUrl: bumper.imageUrls[0] || null,
          imageUrls: bumper.imageUrls,
        },
        create: {
          mondayItemId: bumper.mondayItemId,
          name: bumper.catalogNumber,
          carMake: bumper.carMake,
          carModel: bumper.carModel,
          carYear: bumper.carYear,
          position: bumper.position,
          price: null,
          status: bumper.status,
          imageUrl: bumper.imageUrls[0] || null,
          imageUrls: bumper.imageUrls,
        },
      });

      console.log(`BumperCache updated for item ${itemId}`);
    } else {
      console.warn(`Could not fetch item ${itemId} from Monday — may have been deleted`);
      // If item was deleted from Monday, optionally remove from cache
      await prisma.bumperCache.deleteMany({
        where: { mondayItemId: itemId },
      });
    }

    return NextResponse.json({ success: true, itemId });
  } catch (error) {
    console.error("Monday webhook error:", error);
    // Return 200 even on error to prevent Monday from retrying excessively
    return NextResponse.json({ success: false, error: "Processing failed" }, { status: 200 });
  }
}
