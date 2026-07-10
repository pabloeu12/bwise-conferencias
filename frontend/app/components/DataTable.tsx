"use client";

export type ColunaFormato = "moeda" | "texto";

export interface ColunaConfig {
  chave: string;
  rotulo?: string;
  formato?: ColunaFormato;
}

export interface CorConfig {
  bg: string;
  text: string;
}

function formatarValor(valor: unknown, formato?: ColunaFormato) {
  if (valor === null || valor === undefined || valor === "") return "";
  if (formato === "moeda") {
    const num = typeof valor === "number" ? valor : parseFloat(String(valor));
    if (Number.isNaN(num)) return String(valor);
    return `R$ ${num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return String(valor);
}

export default function DataTable({
  colunas,
  linhas,
  corLinha,
  colunaComCorPropria,
  corCelula,
}: {
  colunas: ColunaConfig[];
  linhas: Record<string, unknown>[];
  /** Colore a linha inteira a partir do valor da própria linha (ex: Status). */
  corLinha?: (linha: Record<string, unknown>) => CorConfig | null;
  /** Se definido, só a célula desta coluna recebe cor (em vez da linha inteira). */
  colunaComCorPropria?: string;
  corCelula?: (valor: unknown) => CorConfig | null;
}) {
  return (
    <div className="overflow-x-auto border border-bwise-borda rounded-xl">
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="bg-bwise-fundo text-bwise-texto-sec text-xs uppercase tracking-wide">
            {colunas.map((col) => (
              <th key={col.chave} className="px-4 py-3 font-bold whitespace-nowrap">
                {col.rotulo ?? col.chave}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, idx) => {
            const corDaLinha = corLinha ? corLinha(linha) : null;
            return (
              <tr
                key={idx}
                className="border-t border-bwise-borda"
                style={corDaLinha ? { backgroundColor: corDaLinha.bg, color: corDaLinha.text } : undefined}
              >
                {colunas.map((col) => {
                  const corIndividual =
                    colunaComCorPropria === col.chave && corCelula ? corCelula(linha[col.chave]) : null;
                  return (
                    <td
                      key={col.chave}
                      className="px-4 py-2.5 whitespace-nowrap"
                      style={corIndividual ? { backgroundColor: corIndividual.bg, color: corIndividual.text } : undefined}
                    >
                      {formatarValor(linha[col.chave], col.formato)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {linhas.length === 0 && (
            <tr>
              <td colSpan={colunas.length} className="px-4 py-8 text-center text-bwise-texto-sec">
                Nenhum resultado encontrado com os filtros atuais.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
