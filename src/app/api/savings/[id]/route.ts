import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import SavingsPlan from "@/models/SavingsPlan";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const { name, targetAmount, currentAmount, targetDate, monthlyContribution, category, description, isActive } = await req.json();
  await connectDB();

  const plan = await SavingsPlan.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { name, targetAmount, currentAmount, targetDate, monthlyContribution, category, description, isActive },
    { new: true }
  );

  if (!plan) {
    return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
  }

  return NextResponse.json(plan);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();

  const plan = await SavingsPlan.findOneAndDelete({ _id: id, userId: session.user.id });
  if (!plan) {
    return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ message: "Eliminado" });
}
