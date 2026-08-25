"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X, Trash2, Check } from "lucide-react";

const CONFIRM_WORD = "BORRAR";

export function DangerZone() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [keepCommitments, setKeepCommitments] = useState(true);
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function close() {
    setOpen(false);
    setConfirmText("");
    setKeepCommitments(true);
  }

  async function handleReset() {
    if (confirmText.trim().toUpperCase() !== CONFIRM_WORD) return;
    setSubmitting(true);
    await fetch("/api/settings/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keepCommitments }),
    });
    setSubmitting(false);
    close();
    // Recarga para reflejar el estado limpio en todo el dashboard
    router.push("/dashboard");
    router.refresh();
  }

  const canConfirm = confirmText.trim().toUpperCase() === CONFIRM_WORD;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-red-200">
      <div className="px-6 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h2 className="font-semibold text-red-700">Zona de peligro</h2>
      </div>
      <div className="p-6">
        <p className="text-sm text-gray-600 mb-1 font-medium">Restablecer datos desde cero</p>
        <p className="text-sm text-gray-500 mb-4">
          Borra tus movimientos y planes de ahorro para empezar limpio. Útil si estás haciendo pruebas.
          Tus topes por categoría y categorías propias se conservan siempre.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium text-sm"
        >
          <Trash2 className="w-4 h-4" />
          Restablecer datos
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Restablecer datos
              </h2>
              <button onClick={close} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Opción conservar compromisos */}
            <div className="space-y-2 mb-4">
              <button
                type="button"
                onClick={() => setKeepCommitments(true)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                  keepCommitments ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-800 text-sm">Conservar compromisos</p>
                  {keepCommitments && <Check className="w-4 h-4 text-green-600" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Mantiene tus compromisos fijos e ingresos (con sus datos de pago) y reinicia el contador de cuotas.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setKeepCommitments(false)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                  !keepCommitments ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-800 text-sm">Borrar todo</p>
                  {!keepCommitments && <Check className="w-4 h-4 text-red-600" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Elimina también todos los compromisos. Empiezas completamente de cero.
                </p>
              </button>
            </div>

            {/* Resumen de qué se borra y qué se conserva */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4 text-xs space-y-2">
              <div>
                <p className="font-semibold text-red-600 mb-1">Se borrará:</p>
                <ul className="text-gray-600 space-y-0.5 list-disc list-inside">
                  <li>Todas las transacciones</li>
                  <li>Todos los planes de ahorro y sus aportes</li>
                  <li>Gastos puntuales del mes</li>
                  {!keepCommitments && <li>Todos los compromisos (fijos e ingresos)</li>}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-green-700 mb-1">Se conserva:</p>
                <ul className="text-gray-600 space-y-0.5 list-disc list-inside">
                  <li>Topes por categoría</li>
                  <li>Categorías propias</li>
                  {keepCommitments && <li>Compromisos fijos e ingresos (con datos de pago)</li>}
                </ul>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-2">
              Esta acción <span className="font-semibold text-red-600">no se puede deshacer</span>. Escribe{" "}
              <span className="font-mono font-bold">{CONFIRM_WORD}</span> para confirmar.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_WORD}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none mb-4 font-mono"
            />

            <div className="flex gap-3">
              <button
                onClick={close}
                disabled={submitting}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                disabled={!canConfirm || submitting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Borrando..." : "Restablecer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
