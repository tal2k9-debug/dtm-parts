import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as Record<string, unknown>)?.role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const updated = await prisma.user.update({
    where: { id: "cmmuq4ag30000kv043nmljs7q" },
    data: { role: "ADMIN" },
  });

  return NextResponse.json({ success: true, name: updated.name, role: updated.role });
}
