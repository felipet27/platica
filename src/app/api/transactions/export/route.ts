import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

// Escapa un valor para CSV: envuelve en comillas y duplica las comillas internas.
function csvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const filter: Record<string, unknown> = { userId: session.user.id };
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }
    filter.date = dateFilter;
  }

  const transactions = await Transaction.find(filter).sort({ date: -1 }).lean();

  const header = ["Fecha", "Tipo", "Categoría", "Descripción", "Monto"];
  const rows = transactions.map((t) => [
    new Date(t.date).toISOString().slice(0, 10),
    t.type === "income" ? "Ingreso" : "Gasto",
    t.category,
    t.description,
    t.amount,
  ]);

  // BOM para que Excel reconozca UTF-8 y no rompa los acentos.
  const csv =
    "﻿" +
    [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");

  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="platica-movimientos-${today}.csv"`,
    },
  });
}
