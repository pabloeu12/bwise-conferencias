"use client";

import { usePathname } from "next/navigation";

const TITULOS: Record<string, { linha1: string; linha2: string; tag: string }> = {
  "/": { linha1: "PLATAFORMA DE AUDITORIA", linha2: "E CONFERÊNCIA", tag: "Painel Executivo" },
  "/rubricas": { linha1: "CONFERÊNCIA", linha2: "DE RUBRICAS", tag: "Painel de Conferência" },
  "/adiantamento": { linha1: "CONFERÊNCIA", linha2: "ADIANTAMENTO SALARIAL", tag: "Painel de Conferência" },
  "/ferias": { linha1: "CONFERÊNCIA", linha2: "RECIBO DE FÉRIAS", tag: "Painel de Conferência" },
  "/consignados": { linha1: "CONFERÊNCIA", linha2: "DE CONSIGNADOS", tag: "Painel de Conferência" },
};

export default function Topbar() {
  const pathname = usePathname();
  const info = TITULOS[pathname] ?? TITULOS["/"];

  return (
    <div className="mx-6 md:mx-12 mt-6 md:mt-8 bg-bwise-superficie border border-bwise-borda rounded-2xl px-6 py-3 flex items-center justify-between gap-4 shrink-0">
      <img src="/logo.png" alt="Bwise Logo" className="w-24 md:w-28 object-contain shrink-0" />

      <div className="text-center flex-1">
        <h1 className="text-bwise-texto font-extrabold text-lg md:text-xl leading-snug tracking-tight">
          {info.linha1}
          <br />
          {info.linha2}
        </h1>
        <span className="block text-bwise-verde-escuro text-[0.65rem] font-bold uppercase tracking-widest mt-1">
          {info.tag}
        </span>
      </div>

      <img src="/logo-macaneiro.jpg" alt="Maçaneiro Logo" className="w-14 md:w-16 rounded-lg object-contain shrink-0" />
    </div>
  );
}
