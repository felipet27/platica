import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Commitment from "@/models/Commitment";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  await connectDB();

  const allowed = ["name", "amount", "type", "incomeType", "category", "isActive", "payDay", "totalInstallments", "installmentsPaid"];
  const setFields: Record<string, unknown> = {};
  for (const field of allowed) {
    if (body[field] !== undefined) setFields[field] = body[field];
  }

  const commitment = await Commitment.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $set: setFields },
    { new: true }
  );

  if (!commitment) {
    return NextResponse.json({ error: "Compromiso no encontrado" }, { status: 404 });
  }

  return NextResponse.json(commitment);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();

  const commitment = await Commitment.findOneAndDelete({ _id: id, userId: session.user.id });
  if (!commitment) {
    return NextResponse.json({ error: "Compromiso no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ message: "Eliminado" });
}
