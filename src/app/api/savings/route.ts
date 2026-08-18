import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import SavingsPlan from "@/models/SavingsPlan";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await connectDB();
  const plans = await SavingsPlan.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean();

  return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { name, targetAmount, targetDate, monthlyContribution, category, description } = body;

  if (!name || !targetAmount || !targetDate || !monthlyContribution || !category) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  await connectDB();
  const plan = await SavingsPlan.create({
    userId: session.user.id,
    name,
    targetAmount: parseFloat(targetAmount),
    targetDate: new Date(targetDate),
    monthlyContribution: parseFloat(monthlyContribution),
    category,
    description,
  });

  return NextResponse.json(plan, { status: 201 });
}
