"use client";

import { useState } from "react";

export default function PassoAPasso({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="border border-bwise-borda rounded-xl mb-8 overflow-hidden">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3 bg-bwise-fundo text-left font-bold text-bwise-texto hover:bg-bwise-borda/50 transition-colors"
      >
        <span>{titulo}</span>
        <span className={`shrink-0 transition-transform duration-200 ${aberto ? "rotate-180" : ""}`}>▾</span>
      </button>
      {aberto && (
        <div className="px-5 py-5 text-sm text-bwise-texto-sec leading-relaxed bg-bwise-superficie space-y-5">
          {children}
        </div>
      )}
    </div>
  );
}
