import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Commitment from "@/models/Commitment";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await connectDB();
  const commitments = await Commitment.find({ userId: session.user.id })
    .sort({ type: 1, name: 1 })
    .lean();
  return NextResponse.json(commitments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { name, amount, type, category, payDay, totalInstallments } = await req.json();
  if (!name || !amount || !type || !category) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  await connectDB();
  const commitment = await Commitment.create({
    userId: session.user.id,
    name,
    amount: parseFloat(amount),
    type,
    category,
    ...(payDay ? { payDay: parseInt(payDay) } : {}),
    ...(totalInstallments ? { totalInstallments: parseInt(totalInstallments), installmentsPaid: 0 } : {}),
  });

  return NextResponse.json(commitment, { status: 201 });
}
