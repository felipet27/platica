"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn, Lock } from "lucide-react";
import { PlaticaLogo } from "@/components/ui/PlaticaLogo";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (res?.error) {
      const status = await fetch(
        `/api/auth/lockstatus?email=${encodeURIComponent(form.email)}`
      ).then((r) => r.json());

      if (status.locked) {
        setError(
          `Cuenta bloqueada por demasiados intentos fallidos. Intenta de nuevo en ${status.minutesLeft} minuto${status.minutesLeft === 1 ? "" : "s"}.`
        );
      } else if (status.attempts >= 3) {
        const left = 5 - status.attempts;
        setError(
          `Email o contraseña incorrectos. ${left} intento${left === 1 ? "" : "s"} restante${left === 1 ? "" : "s"} antes del bloqueo.`
        );
      } else {
        setError("Email o contraseña incorrectos.");
      }
    } else {
      router.push("/dashboard");
    }

    setLoading(false);
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <main className="min-h-screen flex">

      {/* Panel izquierdo — solo desktop */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-14 text-white"
        style={{ backgroundColor: "#16a34a" }}
      >
        <Link href="/">
          <PlaticaLogo variant="wordmark" size="lg" textColor="#ffffff" />
        </Link>

        <div>
          <h1 className="text-4xl font-bold leading-snug mb-4">
            ¿Cómo va esa platíca?<br />
            <span className="text-green-200">Bienvenido de vuelta.</span>
          </h1>
          <p className="text-green-100 text-lg mb-10">
            Tu tablero de control financiero te está esperando.
          </p>
          <ul className="space-y-4">
            {[
              "Tus compromisos del mes en un vistazo",
              "Consejos personalizados según tus hábitos",
              "Tu plata, tu control",
            ].map((texto) => (
              <li key={texto} className="flex items-center gap-3 text-green-100">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-green-200 text-sm">© 2026 Platíca · Gestión de finanzas personales</p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white overflow-y-auto">

        {/* Header móvil */}
        <div className="lg:hidden flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <Link href="/"><PlaticaLogo size="sm" /></Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Volver
          </Link>
        </div>

        <div className="flex flex-col justify-center flex-1 px-8 sm:px-12 lg:px-16 py-10">
          <div className="max-w-md w-full mx-auto">

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Inicia sesión</h2>
              <p className="text-gray-500 text-sm mt-1">Ingresa tus datos para continuar</p>
            </div>

            {/* Botón Google */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 disabled:opacity-50 mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? "Redirigiendo..." : "Continuar con Google"}
            </button>

            {/* Separador */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs text-gray-400">
                <span className="px-3 bg-white">o inicia sesión con email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className={`flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm ${
                  error.includes("bloqueada")
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}>
                  <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-2.5 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90"
                style={{ backgroundColor: "#16a34a" }}
              >
                <LogIn className="w-4 h-4" />
                {loading ? "Entrando..." : "Iniciar sesión"}
              </button>
            </form>

            <p className="text-center text-gray-500 text-sm mt-6">
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="text-green-600 font-medium hover:text-green-700">
                Regístrate gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
