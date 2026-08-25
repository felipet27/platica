import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Budget from "@/models/Budget";
import Transaction from "@/models/Transaction";
import { startOfMonth, endOfMonth } from "date-fns";
import mongoose from "mongoose";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await connectDB();
  const userId = new mongoose.Types.ObjectId(session.user.id);
  const now = new Date();

  const [budgets, spentByCategory] = await Promise.all([
    Budget.find({ userId }).sort({ category: 1 }).lean(),
    Transaction.aggregate([
      { $match: { userId, type: "expense", date: { $gte: startOfMonth(now), $lte: endOfMonth(now) } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]),
  ]);

  const spentMap = new Map(
    (spentByCategory as { _id: string; total: number }[]).map((s) => [s._id, s.total])
  );

  return NextResponse.json(
    budgets.map((b) => ({
      _id: b._id.toString(),
      category: b.category,
      limit: b.limit,
      spent: spentMap.get(b.category) ?? 0,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { category, limit } = await req.json();
  if (!category || limit == null || limit < 0) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  await connectDB();
  const budget = await Budget.findOneAndUpdate(
    { userId: session.user.id, category },
    { $set: { limit: parseFloat(limit) } },
    { new: true, upsert: true }
  );

  return NextResponse.json(budget, { status: 201 });
}
