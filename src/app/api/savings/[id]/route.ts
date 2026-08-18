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
  const body = await req.json();
  await connectDB();

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined)               updates.name = body.name;
  if (body.category !== undefined)           updates.category = body.category;
  if (body.description !== undefined)        updates.description = body.description;
  if (body.isActive !== undefined)           updates.isActive = body.isActive;
  if (body.targetDate !== undefined)         updates.targetDate = new Date(body.targetDate);
  if (body.targetAmount !== undefined)       updates.targetAmount = parseFloat(String(body.targetAmount));
  if (body.currentAmount !== undefined)      updates.currentAmount = parseFloat(String(body.currentAmount));
  if (body.monthlyContribution !== undefined) updates.monthlyContribution = parseFloat(String(body.monthlyContribution));

  const plan = await SavingsPlan.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $set: updates },
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
