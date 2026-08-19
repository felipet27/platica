"use client";

import { useState, useEffect, useRef } from "react";

export function PageInfoTooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [visible]);

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="w-5 h-5 rounded-full bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 border border-green-200 flex items-center justify-center text-xs font-bold transition-colors"
        aria-label="¿Qué es esta sección?"
      >
        ?
      </button>
      {visible && (
        <div className="absolute z-30 top-full left-0 mt-2 w-72 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-xl leading-relaxed">
          {text}
          <div className="absolute bottom-full left-3 border-4 border-transparent border-b-gray-900" />
        </div>
      )}
    </div>
  );
}
