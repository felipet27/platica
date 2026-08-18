import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const page = parseInt(searchParams.get("page") ?? "1");

  const filter: Record<string, unknown> = { userId: session.user.id };
  if (type) filter.type = type;
  if (category) filter.category = category;

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ date: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  return NextResponse.json({ transactions, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { type, amount, category, description, tags, date, commitmentId } = body;

  if (!type || !amount || !category || !description) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  await connectDB();

  const transaction = await Transaction.create({
    userId: session.user.id,
    type,
    amount: parseFloat(amount),
    category,
    description,
    tags: tags ?? [],
    date: date ? new Date(date) : new Date(),
    ...(commitmentId ? { commitmentId } : {}),
  });

  return NextResponse.json(transaction, { status: 201 });
}
