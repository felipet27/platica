import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();
  if (!email) return NextResponse.json({ locked: false, minutesLeft: 0, attempts: 0 });

  await connectDB();
  const user = await User.findOne({ email }).select("lockUntil loginAttempts");
  if (!user) return NextResponse.json({ locked: false, minutesLeft: 0, attempts: 0 });

  const locked = !!(user.lockUntil && user.lockUntil > new Date());
  const minutesLeft = locked
    ? Math.ceil((user.lockUntil!.getTime() - Date.now()) / 60000)
    : 0;

  return NextResponse.json({
    locked,
    minutesLeft,
    attempts: user.loginAttempts ?? 0,
  });
}
