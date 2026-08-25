"use client";

import { useState } from "react";
import { BellRing, X, Check, AlertCircle } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface Props {
  /** Nombre del compromiso recién creado, para personalizar el mensaje. */
  commitmentName: string;
  /** Día de pago del compromiso. */
  payDay: number;
  onClose: () => void;
}

export function PaymentReminderPrompt({ commitmentName, payDay, onClose }: Props) {
  const { loading, error, enable } = usePushNotifications();
  const [done, setDone] = useState(false);

  async function handleEnable() {
    const ok = await enable();
    if (ok) {
      setDone(true);
      // Deja ver el estado de éxito un momento antes de cerrar
      setTimeout(onClose, 1400);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
          {done ? (
            <Check className="w-7 h-7 text-green-600" />
          ) : (
            <BellRing className="w-7 h-7 text-green-600" />
          )}
        </div>

        {done ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              ¡Listo! Te avisaremos
            </h2>
            <p className="text-sm text-gray-500">
              Recibirás un recordatorio el día {payDay} de cada mes.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              ¿Quieres que te recordemos este pago?
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Te enviaremos un aviso el día {payDay} de cada mes para que no se
              te pase <span className="font-medium text-gray-700">{commitmentName}</span>,
              aunque no tengas la app abierta.
            </p>

            {error && (
              <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={handleEnable}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
              >
                <BellRing className="w-4 h-4" />
                {loading ? "Activando..." : "Sí, recordármelo"}
              </button>
              <button
                onClick={onClose}
                disabled={loading}
                className="w-full py-2.5 text-gray-500 hover:text-gray-700 font-medium text-sm disabled:opacity-50"
              >
                Ahora no
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              Puedes activarlas o desactivarlas cuando quieras en Configuración.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
