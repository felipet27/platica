import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Commitment from "@/models/Commitment";
import Transaction from "@/models/Transaction";
import { dateForMonth } from "@/lib/commitments";

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

  const { name, amount, type, expenseType, incomeType, frequency, category, payDay, totalInstallments, month, paymentDetails } = await req.json();
  if (!name || !amount || !type || !category) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const isVariableExpense = type === "expense" && expenseType === "variable";

  await connectDB();
  const commitment = await Commitment.create({
    userId: session.user.id,
    name,
    amount: parseFloat(amount),
    type,
    ...(type === "expense" ? { expenseType: expenseType ?? "fixed" } : {}),
    ...(type === "income" ? { incomeType: incomeType ?? "fixed", frequency: frequency ?? "monthly" } : {}),
    category,
    ...(isVariableExpense && month ? { month } : {}),
    ...(!isVariableExpense && payDay ? { payDay: parseInt(payDay) } : {}),
    ...(!isVariableExpense && totalInstallments ? { totalInstallments: parseInt(totalInstallments), installmentsPaid: 0 } : {}),
    ...(paymentDetails ? { paymentDetails } : {}),
  });

  // Un gasto variable es un gasto puntual que ya ocurrió: lo reflejamos como
  // una transacción real (vinculada al compromiso) para que aparezca en la lista
  // de transacciones y cuente en el balance del mes.
  if (isVariableExpense) {
    await Transaction.create({
      userId: session.user.id,
      type: "expense",
      amount: commitment.amount,
      category: commitment.category,
      description: commitment.name,
      date: dateForMonth(commitment.month),
      commitmentId: commitment._id,
    });
  }

  return NextResponse.json(commitment, { status: 201 });
}
