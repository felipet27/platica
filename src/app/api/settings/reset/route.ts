import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import SavingsPlan from "@/models/SavingsPlan";
import Commitment from "@/models/Commitment";

// Restablece los datos del usuario a cero. Siempre conserva los topes por
// categoría (Budget) y las categorías propias (User.preferences).
// Con keepCommitments=true conserva los compromisos fijos e ingresos (reinicia
// el contador de cuotas y borra los gastos puntuales del mes).
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { keepCommitments } = await req.json();
  const userId = session.user.id;

  await connectDB();

  // Siempre se borran movimientos y ahorros
  await Promise.all([
    Transaction.deleteMany({ userId }),
    SavingsPlan.deleteMany({ userId }),
  ]);

  if (keepCommitments) {
    // Los gastos puntuales/variables son datos del mes, se borran igual
    await Commitment.deleteMany({ userId, type: "expense", expenseType: "variable" });
    // Reinicia el contador de cuotas de los compromisos que se conservan
    await Commitment.updateMany({ userId }, { $set: { installmentsPaid: 0 } });
  } else {
    await Commitment.deleteMany({ userId });
  }

  return NextResponse.json({ ok: true });
}
