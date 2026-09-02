import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Commitment from "@/models/Commitment";
import Transaction from "@/models/Transaction";
import { dateForMonth } from "@/lib/commitments";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  await connectDB();

  const allowed = ["name", "amount", "type", "expenseType", "incomeType", "frequency", "category", "isActive", "payDay", "totalInstallments", "installmentsPaid", "month", "paymentDetails"];
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

  // Mantenemos sincronizada la transacción vinculada a un gasto variable. Usamos
  // upsert para cubrir también gastos variables antiguos que aún no la tenían.
  if (commitment.type === "expense" && commitment.expenseType === "variable") {
    await Transaction.updateOne(
      { commitmentId: commitment._id, userId: session.user.id },
      {
        $set: {
          type: "expense",
          amount: commitment.amount,
          category: commitment.category,
          description: commitment.name,
        },
        $setOnInsert: {
          userId: session.user.id,
          commitmentId: commitment._id,
          date: dateForMonth(commitment.month),
        },
      },
      { upsert: true }
    );
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

  // Un gasto variable y su transacción son la misma cosa: al borrar el gasto,
  // borramos su transacción vinculada. Los gastos fijos, en cambio, conservan
  // su historial de pagos.
  if (commitment.type === "expense" && commitment.expenseType === "variable") {
    await Transaction.deleteMany({ commitmentId: commitment._id, userId: session.user.id });
  }

  return NextResponse.json({ message: "Eliminado" });
}
