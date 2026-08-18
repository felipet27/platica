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
  const { name, amount, type, category, isActive } = await req.json();
  await connectDB();

  const commitment = await Commitment.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { name, amount, type, category, isActive },
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
