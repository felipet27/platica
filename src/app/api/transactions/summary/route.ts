import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await connectDB();
  const userId = new mongoose.Types.ObjectId(session.user.id);

  const { searchParams } = new URL(req.url);
  const months = parseInt(searchParams.get("months") ?? "6");
  const now = new Date();

  const pipeline = Array.from({ length: months }, (_, i) => {
    const start = startOfMonth(subMonths(now, i));
    const end = endOfMonth(subMonths(now, i));
    return { start, end, label: start.toISOString().slice(0, 7) };
  }).reverse();

  const summaries = await Promise.all(
    pipeline.map(async ({ start, end, label }) => {
      const [income, expense] = await Promise.all([
        Transaction.aggregate([
          { $match: { userId: userId, type: "income", date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Transaction.aggregate([
          { $match: { userId: userId, type: "expense", date: { $gte: start, $lte: end } } },
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
  );

  const currentMonth = summaries[summaries.length - 1];

  const categoryBreakdown = await Transaction.aggregate([
    {
      $match: {
        userId: userId,
        type: "expense",
        date: { $gte: startOfMonth(now), $lte: endOfMonth(now) },
      },
    },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } },
  ]);

  return NextResponse.json({ summaries, currentMonth, categoryBreakdown });
}
