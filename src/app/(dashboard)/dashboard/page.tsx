import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import SavingsPlan from "@/models/SavingsPlan";
import Commitment from "@/models/Commitment";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import mongoose from "mongoose";
import DashboardClient from "@/components/dashboard/DashboardClient";

async function getDashboardData(userId: string, refDate: Date) {
  await connectDB();

  const now = refDate;
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Las aggregations de Mongoose no castean automáticamente string → ObjectId
  const userOid = new mongoose.Types.ObjectId(userId);

  const months = Array.from({ length: 6 }, (_, i) => ({
    start: startOfMonth(subMonths(now, 5 - i)),
    end: endOfMonth(subMonths(now, 5 - i)),
    label: startOfMonth(subMonths(now, 5 - i)).toISOString().slice(0, 7),
  }));

  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));

  const [
    monthlySummaries,
    categoryBreakdown,
    prevCategoryBreakdownAgg,
    recentTransactions,
    savingsPlans,
    activeCommitments,
    paidCommitmentsAgg,
    incomeByCategoryAgg,
    savingsContributionsAgg,
  ] = await Promise.all([
    Promise.all(
      months.map(async ({ start, end, label }) => {
        const [income, expense] = await Promise.all([
          Transaction.aggregate([
            { $match: { userId: userOid, type: "income", date: { $gte: start, $lte: end } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]),
          Transaction.aggregate([
            { $match: { userId: userOid, type: "expense", date: { $gte: start, $lte: end } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]),
        ]);
        return {
          month: label,
          income: income[0]?.total ?? 0,
          expense: expense[0]?.total ?? 0,
          balance: (income[0]?.total ?? 0) - (expense[0]?.total ?? 0),
        };
      })
    ),
    Transaction.aggregate([
      {
        $match: {
          userId: userOid,
          type: "expense",
          date: { $gte: monthStart, $lte: monthEnd },
        },
      },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]),
    Transaction.aggregate([
      {
        $match: {
          userId: userOid,
          type: "expense",
          date: { $gte: prevMonthStart, $lte: prevMonthEnd },
        },
      },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]),
    Transaction.find({ userId }).sort({ date: -1 }).limit(5).lean(),
    SavingsPlan.find({ userId, isActive: true }).lean(),
    // Los gastos variables ya son transacciones reales; no se muestran aquí como
    // compromisos pendientes de pago.
    Commitment.find({ userId, isActive: true, expenseType: { $ne: "variable" } })
      .sort({ type: 1, name: 1 })
      .lean(),
    Transaction.aggregate([
      {
        $match: {
          userId: userOid,
          commitmentId: { $exists: true, $ne: null },
          date: { $gte: monthStart, $lte: monthEnd },
        },
      },
      { $group: { _id: "$commitmentId", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      {
        $match: {
          userId: userOid,
          type: "income",
          date: { $gte: monthStart, $lte: monthEnd },
        },
      },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]),
    Transaction.aggregate([
      {
        $match: {
          userId: userOid,
          type: "expense",
          category: "Ahorro",
          date: { $gte: monthStart, $lte: monthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const current = monthlySummaries[monthlySummaries.length - 1];

  const paidIds = new Map(
    paidCommitmentsAgg.map((p) => [p._id?.toString(), { total: p.total as number, count: p.count as number }])
  );

  const commitments = activeCommitments.map((c) => {
    const paid = paidIds.get(c._id.toString());
    return {
      _id: c._id.toString(),
      name: c.name,
      amount: c.amount,
      type: c.type as "income" | "expense",
      incomeType: (c.incomeType ?? "fixed") as "fixed" | "variable",
      frequency: (c.frequency ?? "monthly") as "monthly" | "biweekly",
      category: c.category,
      paid: !!paid,
      paidAmount: paid?.total ?? 0,
      paidCount: paid?.count ?? 0,
      payDay: c.payDay ?? undefined,
      totalInstallments: c.totalInstallments ?? undefined,
      installmentsPaid: c.installmentsPaid ?? 0,
      paymentDetails: c.paymentDetails
        ? {
            entity: c.paymentDetails.entity ?? undefined,
            accountNumber: c.paymentDetails.accountNumber ?? undefined,
            note: c.paymentDetails.note ?? undefined,
          }
        : undefined,
    };
  });

  const monthlySavingsContributions: number = savingsContributionsAgg[0]?.total ?? 0;

  return {
    monthlySummaries,
    monthlySavingsContributions,
    categoryBreakdown: categoryBreakdown.map((c) => ({ name: c._id, value: c.total })),
    prevCategoryBreakdown: prevCategoryBreakdownAgg.map((c) => ({ name: c._id, value: c.total })),
    recentTransactions: recentTransactions.map((t) => ({
      _id: t._id.toString(),
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description,
      date: t.date.toISOString(),
    })),
    savingsPlans: savingsPlans.map((p) => ({
      _id: p._id.toString(),
      name: p.name,
      targetAmount: p.targetAmount,
      currentAmount: p.currentAmount,
      targetDate: p.targetDate.toISOString(),
      monthlyContribution: p.monthlyContribution,
    })),
    currentMonth: current,
    commitments,
    incomeByCategory: incomeByCategoryAgg.map((i) => ({
      category: i._id as string,
      total: i.total as number,
    })),
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await auth();
  const { month } = await searchParams;

  // month viene como "YYYY-MM"; usamos el día 15 al mediodía para evitar
  // desbordes de zona horaria al calcular inicio/fin de mes.
  const validMonth = month && /^\d{4}-\d{2}$/.test(month) ? month : null;
  const refDate = validMonth ? new Date(`${validMonth}-15T12:00:00`) : new Date();

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const selectedMonth = validMonth ?? currentMonthStr;

  const data = await getDashboardData(session!.user!.id!, refDate);
  return (
    <DashboardClient
      data={data}
      userName={session!.user!.name ?? "Usuario"}
      selectedMonth={selectedMonth}
      isCurrentMonth={selectedMonth === currentMonthStr}
    />
  );
}
