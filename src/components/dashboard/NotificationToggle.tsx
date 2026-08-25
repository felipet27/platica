"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";

// Convierte la clave pública VAPID (base64url) al formato que espera el navegador.
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return buffer;
}

export function NotificationToggle() {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(ok);
    if (!ok) return;
    if (Notification.permission === "denied") setDenied(true);
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEnabled(!!sub))
      .catch(() => {});
  }, []);

  async function enable() {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setDenied(permission === "denied");
        setLoading(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) throw new Error("Falta la clave pública VAPID");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      setEnabled(true);
    } catch {
      // Silencioso: si algo falla el estado sigue en desactivado
    } finally {
      setLoading(false);
    }
  }

  async function disable() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEnabled(false);
    } catch {
      // ignorar
    } finally {
      setLoading(false);
    }
  }

  if (!supported) {
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <BellOff className="w-5 h-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Notificaciones</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500">
            Tu navegador no soporta notificaciones push. En iPhone/iPad, primero instala Platíca en tu pantalla de inicio y ábrela desde ahí.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        {enabled ? <BellRing className="w-5 h-5 text-green-600" /> : <Bell className="w-5 h-5 text-gray-400" />}
        <h2 className="font-semibold text-gray-900">Notificaciones</h2>
      </div>
      <div className="p-6">
        <p className="text-sm text-gray-500 mb-4">
          Recibe un aviso en tu dispositivo cuando un compromiso esté por vencer o ya haya vencido, aunque no tengas la app abierta.
        </p>

        {denied ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            Bloqueaste las notificaciones para este sitio. Actívalas desde la configuración del navegador (candado junto a la dirección) y vuelve a intentar.
          </div>
        ) : enabled ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <BellRing className="w-4 h-4" />
              <span className="font-medium">Notificaciones activadas</span>
            </div>
            <button
              onClick={disable}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm disabled:opacity-50"
            >
              {loading ? "..." : "Desactivar"}
            </button>
          </div>
        ) : (
          <button
            onClick={enable}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm disabled:opacity-50"
          >
            <Bell className="w-4 h-4" />
            {loading ? "Activando..." : "Activar notificaciones"}
          </button>
        )}
      </div>
    </div>
  );
}
