import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(session.user.id).select("preferences");
  return NextResponse.json({
    currency: user?.preferences?.currency ?? "COP",
    customCategories: {
      income: user?.preferences?.customCategories?.income ?? [],
      expense: user?.preferences?.customCategories?.expense ?? [],
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { currency, customCategories } = await req.json();
  await connectDB();

  const update: Record<string, unknown> = {};
  if (currency !== undefined) update["preferences.currency"] = currency;
  if (customCategories !== undefined) {
    // Normaliza: recorta, quita vacíos y duplicados
    const clean = (arr: unknown): string[] =>
      Array.isArray(arr)
        ? [...new Set(arr.map((s) => String(s).trim()).filter(Boolean))]
        : [];
    if (customCategories.income !== undefined)
      update["preferences.customCategories.income"] = clean(customCategories.income);
    if (customCategories.expense !== undefined)
      update["preferences.customCategories.expense"] = clean(customCategories.expense);
  }

  await User.findByIdAndUpdate(session.user.id, update);

  return NextResponse.json({ ok: true });
}
