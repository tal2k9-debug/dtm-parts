import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { notifyAdmin, formatNewCustomerMessage } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      username,
      password,
      name,
      phone,
      email,
      businessName,
      businessAddress,
      businessId,
      businessType,
    } = body;

    // Validate required fields
    if (!username || !password || !name || !phone) {
      return NextResponse.json(
        { error: "שם משתמש, סיסמה, שם מלא וטלפון הם שדות חובה" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "הסיסמה חייבת להכיל לפחות 6 תווים" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "שם המשתמש כבר קיים במערכת" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        name,
        phone,
        email: email || null,
        businessName: businessName || null,
        businessAddress: businessAddress || null,
        businessId: businessId || null,
        businessType: businessType || null,
      },
    });

    // Send WhatsApp notification (non-blocking)
    try {
      await notifyAdmin(
        formatNewCustomerMessage({
          name: user.name,
          phone: user.phone,
          businessName: user.businessName || undefined,
        })
      );
    } catch (error) {
      console.error("Failed to send WhatsApp notification for new user:", error);
    }

    // Return user without passwordHash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "שגיאה בהרשמה, נסה שוב מאוחר יותר" },
      { status: 500 }
    );
  }
}
