import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(session.user.id).select("preferences");
  return NextResponse.json({ currency: user?.preferences?.currency ?? "COP" });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { currency } = await req.json();
  await connectDB();

  await User.findByIdAndUpdate(session.user.id, {
    "preferences.currency": currency,
  });

  return NextResponse.json({ currency });
}
