"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const ITENS_NAV = [
  { href: "/", label: "Início", icone: "🏠" },
  { href: "/rubricas", label: "Rubricas", icone: "📊" },
  { href: "/adiantamento", label: "Adiantamento", icone: "💵" },
  { href: "/ferias", label: "Férias", icone: "🏖️" },
  { href: "/consignados", label: "Consignados", icone: "💳" },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [aberta, setAberta] = useState(true);

  return (
    <aside
      className={`${aberta ? "w-64" : "w-20"} shrink-0 bg-bwise-superficie border-r border-bwise-borda flex flex-col transition-all duration-300 ease-in-out`}
    >
      <div
        className={`p-6 pb-4 flex ${aberta ? "justify-between" : "justify-center"} items-center border-b border-bwise-borda`}
      >
        {aberta && (
          <a
            href="https://www.bwisecontabilidade.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer transition-opacity hover:opacity-80"
          >
            <img src="/logo.png" alt="Bwise Logo" className="w-28 object-contain" />
          </a>
        )}
        <button
          onClick={() => setAberta(!aberta)}
          className="p-2 rounded-xl bg-bwise-fundo text-bwise-grafite border border-bwise-borda hover:bg-bwise-borda transition-colors"
          aria-label={aberta ? "Recolher menu" : "Expandir menu"}
        >
          {aberta ? "❮" : "❯"}
        </button>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-2">
        {ITENS_NAV.map((item) => {
          const ativo = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              disabled={ativo}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-r-full text-left transition-colors ${
                ativo
                  ? "bg-bwise-verde-claro text-bwise-texto font-bold border-l-4 border-bwise-verde"
                  : "font-medium text-bwise-texto-sec hover:bg-bwise-fundo hover:text-bwise-texto"
              }`}
            >
              <span>{item.icone}</span>
              {aberta && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {aberta && (
        <div className="px-6 py-4 border-t border-bwise-borda">
          <p className="text-xs text-bwise-texto-sec font-medium">© 2026 Bwise Analytics</p>
        </div>
      )}
    </aside>
  );
}
