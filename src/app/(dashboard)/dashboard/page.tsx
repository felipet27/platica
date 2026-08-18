import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import SavingsPlan from "@/models/SavingsPlan";
import Commitment from "@/models/Commitment";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import mongoose from "mongoose";
import DashboardClient from "@/components/dashboard/DashboardClient";

async function getDashboardData(userId: string) {
  await connectDB();

  const now = new Date();
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
    Commitment.find({ userId, isActive: true }).sort({ type: 1, name: 1 }).lean(),
    Transaction.aggregate([
      {
        $match: {
          userId: userOid,
          commitmentId: { $exists: true, $ne: null },
          date: { $gte: monthStart, $lte: monthEnd },
        },
      },
      { $group: { _id: "$commitmentId", total: { $sum: "$amount" } } },
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
  ]);

  const current = monthlySummaries[monthlySummaries.length - 1];

  const paidIds = new Map(
    paidCommitmentsAgg.map((p) => [p._id?.toString(), p.total as number])
  );

  const commitments = activeCommitments.map((c) => ({
    _id: c._id.toString(),
    name: c.name,
    amount: c.amount,
    type: c.type as "income" | "expense",
    incomeType: (c.incomeType ?? "fixed") as "fixed" | "variable",
    category: c.category,
    paid: paidIds.has(c._id.toString()),
    paidAmount: paidIds.get(c._id.toString()) ?? 0,
    payDay: c.payDay ?? undefined,
    totalInstallments: c.totalInstallments ?? undefined,
    installmentsPaid: c.installmentsPaid ?? 0,
  }));

  return {
    monthlySummaries,
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

export default async function DashboardPage() {
  const session = await auth();
  const data = await getDashboardData(session!.user!.id!);
  return <DashboardClient data={data} userName={session!.user!.name ?? "Usuario"} />;
}
