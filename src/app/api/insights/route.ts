import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Commitment from "@/models/Commitment";
import { WATCH_CATEGORIES } from "@/lib/categories";
import { startOfMonth, endOfMonth, subMonths, differenceInDays } from "date-fns";
import mongoose from "mongoose";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await connectDB();
  // Aggregate pipelines no castean automáticamente strings a ObjectId — convertir explícitamente
  const userId = new mongoose.Types.ObjectId(session.user.id);
  const now = new Date();

  // Datos del mes actual y los 3 meses anteriores
  const [incomeAgg, expenseByCategory, allTransactions, prevMonthsExpense, incomeCommitmentsCount] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId, type: "income", date: { $gte: startOfMonth(now), $lte: endOfMonth(now) } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { userId, type: "expense", date: { $gte: startOfMonth(now), $lte: endOfMonth(now) } } },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    Transaction.find({
      userId,
      type: "expense",
      date: { $gte: startOfMonth(now), $lte: endOfMonth(now) },
    }).sort({ amount: 1 }).lean(),
    Transaction.aggregate([
      {
        $match: {
          userId,
          type: "expense",
          date: { $gte: startOfMonth(subMonths(now, 3)), $lte: endOfMonth(subMonths(now, 1)) },
        },
      },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]),
    Commitment.countDocuments({ userId, type: "income", isActive: true }),
  ]);

  const monthlyIncome = incomeAgg[0]?.total ?? 0;
  const totalExpense = expenseByCategory.reduce((s: number, c: { total: number }) => s + c.total, 0);
  const balance = monthlyIncome - totalExpense;

  // Los aportes a planes de ahorro se registran como gasto categoría "Ahorro".
  // No son consumo, así que se suman al balance para calcular la tasa real.
  const savingsContributions = (expenseByCategory as { _id: string; total: number }[])
    .find((c) => c._id === "Ahorro")?.total ?? 0;
  const savingsRate = monthlyIncome > 0
    ? ((balance + savingsContributions) / monthlyIncome) * 100
    : 0;

  // Mapa de gasto promedio de meses anteriores por categoría
  const prevAvgMap: Record<string, number> = {};
  for (const e of prevMonthsExpense as { _id: string; total: number }[]) {
    prevAvgMap[e._id] = e.total / 3;
  }

  // Gastos hormiga: transacciones pequeñas (< 5% del ingreso mensual) frecuentes
  const smallThreshold = monthlyIncome > 0 ? monthlyIncome * 0.03 : 50000;
  const smallTransactions = allTransactions.filter((t) => t.amount <= smallThreshold);
  const hormigaTotal = smallTransactions.reduce((s, t) => s + t.amount, 0);

  // Genera alertas por categoría
  const alerts: {
    category: string;
    label: string;
    amount: number;
    percent: number;
    prevAvg: number;
    tip: string;
    severity: "high" | "medium" | "low";
  }[] = [];

  for (const cat of expenseByCategory as { _id: string; total: number; count: number }[]) {
    const watchInfo = WATCH_CATEGORIES[cat._id];
    if (!watchInfo) continue;

    const percent = monthlyIncome > 0 ? cat.total / monthlyIncome : 0;
    const prevAvg = prevAvgMap[cat._id] ?? 0;
    const isOverThreshold = percent > watchInfo.threshold;
    const isIncreasing = prevAvg > 0 && cat.total > prevAvg * 1.15;

    if (isOverThreshold || isIncreasing) {
      alerts.push({
        category: cat._id,
        label: watchInfo.label,
        amount: cat.total,
        percent: percent * 100,
        prevAvg,
        tip: watchInfo.tip,
        severity: percent > watchInfo.threshold * 1.5 ? "high" : isIncreasing ? "medium" : "low",
      });
    }
  }

  // Consejo de gastos hormiga
  const hormigaPercent = monthlyIncome > 0 ? (hormigaTotal / monthlyIncome) * 100 : 0;
  const hormigaAlert =
    smallTransactions.length >= 5
      ? {
          category: "hormiga",
          label: "Gastos hormiga detectados",
          amount: hormigaTotal,
          count: smallTransactions.length,
          percent: hormigaPercent,
          tip: `Tienes ${smallTransactions.length} transacciones pequeñas este mes que suman ${hormigaTotal.toLocaleString("es-CO")}. Revisa cuáles son prescindibles.`,
          severity: hormigaPercent > 15 ? ("high" as const) : ("medium" as const),
        }
      : null;

  // Recomendaciones de ahorro
  const savingsTips: string[] = [];

  if (monthlyIncome === 0) {
    if (incomeCommitmentsCount > 0) {
      savingsTips.push("Tienes ingresos fijos configurados pero aún no has registrado ninguno como transacción este mes. Regístralos cuando los recibas para ver el análisis.");
    } else {
      savingsTips.push("No tienes ingresos registrados este mes. Agrégalos desde el Dashboard para ver tu tasa de ahorro y análisis financiero.");
    }
  } else if (balance < 0) {
    savingsTips.push(`Este mes estás en déficit: tus gastos superan tus ingresos en $${Math.abs(balance).toLocaleString("es-CO")}. Identifica los 2 gastos más altos y redúcelos.`);
  } else if (savingsRate < 10) {
    savingsTips.push(`Tu tasa de ahorro este mes es del ${savingsRate.toFixed(1)}%. Lo ideal es ahorrar al menos el 20% de tus ingresos.`);
  } else if (savingsRate < 20) {
    savingsTips.push(`Vas bien — ahorras el ${savingsRate.toFixed(1)}% de tus ingresos este mes. Intenta llegar al 20%.`);
  } else {
    savingsTips.push(`Excelente — ahorras el ${savingsRate.toFixed(1)}% de tus ingresos. Considera invertir el excedente en fondos de bajo riesgo.`);
  }

  const daysInMonth = differenceInDays(endOfMonth(now), startOfMonth(now)) + 1;
  const dayOfMonth = now.getDate();
  const projectedExpense = dayOfMonth > 0 ? (totalExpense / dayOfMonth) * daysInMonth : 0;
  if (projectedExpense > monthlyIncome * 0.9) {
    savingsTips.push(
      `A este ritmo proyectas gastar $${projectedExpense.toLocaleString("es-CO")} este mes, cerca de tu ingreso total. Frena gastos no esenciales.`
    );
  }

  const topCategory = expenseByCategory[0] as { _id: string; total: number } | undefined;
  if (topCategory && monthlyIncome > 0 && topCategory.total / monthlyIncome > 0.3) {
    savingsTips.push(
      `"${topCategory._id}" es tu mayor gasto (${((topCategory.total / monthlyIncome) * 100).toFixed(0)}% de tus ingresos). Ponle un tope mensual.`
    );
  }

  // Regla 50/30/20
  const rule = {
    needs: { target: 50, actual: monthlyIncome > 0 ? (totalExpense / monthlyIncome) * 100 : 0 },
    wants: { target: 30, actual: 0 },
    savings: { target: 20, actual: savingsRate },
  };

  return NextResponse.json({
    summary: {
      monthlyIncome,
      totalExpense,
      balance,
      savingsRate,
      projectedExpense,
      savingsContributions,
      hasIncomeCommitments: incomeCommitmentsCount > 0,
    },
    alerts: alerts.sort((a, b) => (b.severity === "high" ? 1 : -1)),
    hormigaAlert,
    savingsTips,
    expenseByCategory: (expenseByCategory as { _id: string; total: number; count: number }[]).map((c) => ({
      category: c._id,
      amount: c.total,
      count: c.count,
      percent: monthlyIncome > 0 ? (c.total / monthlyIncome) * 100 : 0,
    })),
    rule,
  });
}
