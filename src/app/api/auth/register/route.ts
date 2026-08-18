import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
    }

    await connectDB();

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }

    await User.create({ name, email, password });

    return NextResponse.json({ message: "Usuario creado exitosamente" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
