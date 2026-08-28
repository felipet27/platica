import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { password } = await req.json();
  if (!password) {
    return NextResponse.json({ error: "Contraseña requerida" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(session.user.id).select("+password loginAttempts lockUntil");
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  if (!user.password) {
    return NextResponse.json({ error: "Sin contraseña local" }, { status: 422 });
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Cuenta bloqueada. Intenta en ${minutesLeft} min.`, locked: true, minutesLeft },
      { status: 423 }
    );
  }

  const valid = await bcrypt.compare(password as string, user.password);

  if (!valid) {
    const attempts = (user.loginAttempts ?? 0) + 1;
    const update: Record<string, unknown> = { loginAttempts: attempts };
    if (attempts >= MAX_ATTEMPTS) {
      update.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
    }
    await User.updateOne({ _id: user._id }, { $set: update });

    const remaining = MAX_ATTEMPTS - attempts;
    const msg =
      remaining > 0
        ? `Contraseña incorrecta. ${remaining} intento${remaining === 1 ? "" : "s"} restante${remaining === 1 ? "" : "s"}.`
        : "Cuenta bloqueada por 15 minutos.";
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  await User.updateOne({ _id: user._id }, { $set: { loginAttempts: 0, lockUntil: null } });
  return NextResponse.json({ ok: true });
}
