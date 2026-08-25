"use client";

import { Bell, BellOff, BellRing, AlertCircle } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function NotificationToggle() {
  const { supported, enabled, denied, loading, error, enable, disable } =
    usePushNotifications();

  if (!supported) {
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <BellOff className="w-5 h-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Notificaciones</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500">
            Tu navegador no soporta notificaciones push. En iPhone/iPad, primero
            instala Platíca en tu pantalla de inicio y ábrela desde ahí.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        {enabled ? (
          <BellRing className="w-5 h-5 text-green-600" />
        ) : (
          <Bell className="w-5 h-5 text-gray-400" />
        )}
        <h2 className="font-semibold text-gray-900">Notificaciones</h2>
      </div>
      <div className="p-6">
        <p className="text-sm text-gray-500 mb-4">
          Recibe un aviso en tu dispositivo cuando un compromiso esté por vencer
          o ya haya vencido, aunque no tengas la app abierta.
        </p>

        {denied ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            Bloqueaste las notificaciones para este sitio. Actívalas desde la
            configuración del navegador (candado junto a la dirección) y vuelve
            a intentar.
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

        {error && (
          <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
