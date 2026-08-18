"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export function InstallBanner() {
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
      || window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = localStorage.getItem("platica_install_dismissed") === "true";

    setIsIos(ios);
    if (ios && !standalone && !dismissed) setShow(true);
  }, []);

  function dismiss() {
    localStorage.setItem("platica_install_dismissed", "true");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white border border-green-200 rounded-2xl shadow-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Instalar Platíca</p>
            {isIos ? (
              <p className="text-xs text-gray-500 mt-0.5">
                Toca{" "}
                <span className="inline-flex items-center gap-0.5 font-medium text-blue-600">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  Compartir
                </span>
                {" "}y luego{" "}
                <span className="font-medium text-gray-700">"Agregar a pantalla de inicio"</span>
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-0.5">
                Instala la app para acceso rápido desde tu pantalla de inicio
              </p>
            )}
          </div>
        </div>
        <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 shrink-0 mt-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
