"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallBanner() {
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const standalone =
      (navigator as Navigator & { standalone?: boolean }).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;

    if (standalone) return; // Ya está instalada

    const dismissed = localStorage.getItem("platica_install_dismissed") === "true";
    if (dismissed) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const safari = /safari/i.test(navigator.userAgent) && !/chrome|crios|fxios|edgios/i.test(navigator.userAgent);

    if (ios && safari) {
      // iOS Safari: instrucciones manuales
      setIsIos(true);
      setShow(true);
      return;
    }

    // Chrome / Edge / Samsung Browser en Android: esperamos el evento nativo
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") dismiss();
    else setDeferredPrompt(null);
  }

  function dismiss() {
    localStorage.setItem("platica_install_dismissed", "true");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white border border-green-200 rounded-2xl shadow-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">Instalar Platíca</p>
            {isIos ? (
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Toca{" "}
                <span className="inline-flex items-center gap-0.5 font-medium text-blue-600">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  Compartir
                </span>{" "}
                y luego{" "}
                <span className="font-medium text-gray-700">"Agregar a pantalla de inicio"</span>
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-0.5">
                Acceso rápido desde tu pantalla de inicio, sin abrir el navegador.
              </p>
            )}
          </div>
        </div>
        <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 shrink-0 mt-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>

      {!isIos && deferredPrompt && (
        <button
          onClick={install}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Download className="w-4 h-4" />
          Instalar ahora
        </button>
      )}
    </div>
  );
}
