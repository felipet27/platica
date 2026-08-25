import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Commitment from "@/models/Commitment";
import Transaction from "@/models/Transaction";
import PushSubscription from "@/models/PushSubscription";
import { getWebPush } from "@/lib/webpush";
import { startOfMonth, endOfMonth } from "date-fns";

// Recorre los compromisos de gasto con día de pago hoy o vencidos este mes,
// que aún no se han pagado, y envía una notificación push al usuario dueño.
// Protegido con CRON_SECRET. Pensado para dispararse una vez al día (Vercel Cron).

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await connectDB();
  const wp = getWebPush();

  const now = new Date();
  const today = now.getDate();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Compromisos de gasto activos con día de pago hoy o ya vencido este mes
  const commitments = await Commitment.find({
    type: "expense",
    isActive: true,
    payDay: { $ne: null, $lte: today },
  }).lean();

  // Pagos ya registrados este mes (para no recordar lo ya pagado)
  const paidThisMonth = await Transaction.aggregate([
    { $match: { commitmentId: { $ne: null }, date: { $gte: monthStart, $lte: monthEnd } } },
    { $group: { _id: "$commitmentId" } },
  ]);
  const paidIds = new Set(paidThisMonth.map((p) => p._id?.toString()));

  // Agrupa compromisos pendientes por usuario
  const byUser = new Map<string, { name: string; amount: number; payDay: number; overdue: boolean }[]>();
  for (const c of commitments) {
    if (paidIds.has(c._id.toString())) continue;
    const userId = c.userId.toString();
    if (!byUser.has(userId)) byUser.set(userId, []);
    byUser.get(userId)!.push({
      name: c.name,
      amount: c.amount,
      payDay: c.payDay!,
      overdue: c.payDay! < today,
    });
  }

  let sent = 0;
  let removed = 0;

  for (const [userId, items] of byUser) {
    const subs = await PushSubscription.find({ userId }).lean();
    if (subs.length === 0) continue;

    const count = items.length;
    const first = items[0];
    const title = count === 1
      ? (first.overdue ? "Pago pendiente" : "Recordatorio de pago")
      : `Tienes ${count} pagos pendientes`;
    const body = count === 1
      ? `${first.name} · $${first.amount.toLocaleString("es-CO")}${first.overdue ? " (vencido)" : ` — día ${first.payDay}`}`
      : items.slice(0, 3).map((i) => i.name).join(", ") + (count > 3 ? "…" : "");

    const payload = JSON.stringify({ title, body, url: "/dashboard" });

    for (const sub of subs) {
      try {
        await wp.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        );
        sent++;
      } catch (err: unknown) {
        // 404/410: suscripción expirada — la eliminamos
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await PushSubscription.deleteOne({ endpoint: sub.endpoint });
          removed++;
        }
      }
    }
  }

  return NextResponse.json({ ok: true, sent, removed, usersNotified: byUser.size });
}
