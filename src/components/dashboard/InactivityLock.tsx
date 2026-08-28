"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { signOut } from "next-auth/react";

const TIMEOUT_MS = 10 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart"] as const;

interface Props {
  user: { name: string; email: string };
}

export default function InactivityLock({ user }: Props) {
  const [locked, setLocked] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [noPassword, setNoPassword] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef(Date.now());

  const lock = useCallback(() => {
    setLocked(true);
    setPassword("");
    setError("");
    setShowPassword(false);
  }, []);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(lock, TIMEOUT_MS);
  }, [lock]);

  useEffect(() => {
    resetTimer();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));

    const handleVisibility = () => {
      if (!document.hidden && Date.now() - lastActivityRef.current >= TIMEOUT_MS) {
        lock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetTimer));
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [resetTimer, lock]);

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/verify-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();

    if (res.ok) {
      setLocked(false);
      setPassword("");
      resetTimer();
    } else if (res.status === 422) {
      setNoPassword(true);
    } else {
      setError(data.error ?? "Contraseña incorrecta");
    }

    setLoading(false);
  };

  if (!locked) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/95 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <Lock className="w-7 h-7 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sesión bloqueada</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
          </div>
        </div>

        {noPassword ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Tu cuenta usa Google para autenticarse. Debes volver a iniciar sesión.
            </p>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
            >
              Ir a iniciar sesión
            </button>
          </div>
        ) : (
          <form onSubmit={unlock} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                autoFocus
                disabled={loading}
                className="w-full px-4 py-2.5 pr-10 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
            >
              {loading ? "Verificando..." : "Desbloquear"}
            </button>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Cerrar sesión
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
