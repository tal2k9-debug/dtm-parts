import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET - fetch current user profile
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      businessName: true,
      businessAddress: true,
      businessId: true,
      businessType: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

// PUT - update user profile
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  }

  const body = await request.json();
  const { name, phone, email, businessName, businessAddress, businessId, businessType } = body;

  // Basic validation
  if (!name || !phone) {
    return NextResponse.json({ error: "שם וטלפון הם שדות חובה" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      phone,
      email: email || null,
      businessName: businessName || null,
      businessAddress: businessAddress || null,
      businessId: businessId || null,
      businessType: businessType || null,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      businessName: true,
      businessAddress: true,
      businessId: true,
      businessType: true,
    },
  });

  return NextResponse.json({ user, message: "הפרטים עודכנו בהצלחה" });
}
