import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Role } from "@prisma/client";

// GET /api/admin/customers/[id] — Fetch customer details with requests
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as Record<string, unknown> | undefined)?.role;

    if (!session || role !== "ADMIN") {
      return NextResponse.json(
        { error: "אין הרשאה" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const customer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        businessName: true,
        businessType: true,
        businessId: true,
        businessAddress: true,
        role: true,
        notes: true,
        createdAt: true,
        lastLogin: true,
        requests: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            carMake: true,
            carModel: true,
            carYear: true,
            position: true,
            status: true,
            quotedPrice: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "לקוח לא נמצא" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Customer fetch error:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת פרטי הלקוח" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/customers/[id] — Update customer notes, role (VIP toggle)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as Record<string, unknown> | undefined)?.role;

    if (!session || role !== "ADMIN") {
      return NextResponse.json(
        { error: "אין הרשאה" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "לקוח לא נמצא" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    if (body.role !== undefined) {
      if (!["CUSTOMER", "VIP"].includes(body.role)) {
        return NextResponse.json(
          { error: "תפקיד לא חוקי" },
          { status: 400 }
        );
      }
      updateData.role = body.role as Role;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "לא נשלחו שדות לעדכון" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        role: true,
        notes: true,
      },
    });

    return NextResponse.json({
      success: true,
      customer: updated,
    });
  } catch (error) {
    console.error("Customer update error:", error);
    return NextResponse.json(
      { error: "שגיאה בעדכון פרטי הלקוח" },
      { status: 500 }
    );
  }
}
