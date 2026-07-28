"use client";

import { useMemo, useState } from "react";

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

const VAZIO = "(vazio)";

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
  // Ordem atual das colunas (índices em `colunas`) — permite arrastar para reordenar.
  const [ordem, setOrdem] = useState<number[]>(() => colunas.map((_, i) => i));
  const [posArrastando, setPosArrastando] = useState<number | null>(null);

  // Filtro por coluna, estilo Excel: chave da coluna -> conjunto de valores exibidos.
  // Ausência da chave = sem filtro (todos os valores exibidos).
  const [filtros, setFiltros] = useState<Record<string, Set<string>>>({});
  const [colunaFiltroAberta, setColunaFiltroAberta] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const colunasOrdenadas = useMemo(() => {
    const validos = ordem.filter((i) => i >= 0 && i < colunas.length);
    return validos.length === colunas.length ? validos.map((i) => colunas[i]) : colunas;
  }, [ordem, colunas]);

  const valoresPorColuna = useMemo(() => {
    const mapa = new Map<string, { valor: string; quantidade: number }[]>();
    for (const col of colunas) {
      const contagem = new Map<string, number>();
      for (const linha of linhas) {
        const valor = formatarValor(linha[col.chave], col.formato) || VAZIO;
        contagem.set(valor, (contagem.get(valor) ?? 0) + 1);
      }
      mapa.set(
        col.chave,
        Array.from(contagem.entries())
          .map(([valor, quantidade]) => ({ valor, quantidade }))
          .sort((a, b) => a.valor.localeCompare(b.valor, "pt-BR", { numeric: true }))
      );
    }
    return mapa;
  }, [linhas, colunas]);

  const linhasFiltradas = useMemo(() => {
    const chavesComFiltro = Object.keys(filtros).filter((chave) => filtros[chave]?.size > 0);
    if (chavesComFiltro.length === 0) return linhas;
    return linhas.filter((linha) =>
      chavesComFiltro.every((chave) => {
        const col = colunas.find((c) => c.chave === chave);
        const valor = formatarValor(linha[chave], col?.formato) || VAZIO;
        return filtros[chave].has(valor);
      })
    );
  }, [linhas, filtros, colunas]);

  function alternarValorFiltro(chave: string, valor: string) {
    setFiltros((prev) => {
      const todos = (valoresPorColuna.get(chave) ?? []).map((v) => v.valor);
      const atual = new Set(prev[chave] ?? todos);
      if (atual.has(valor)) atual.delete(valor);
      else atual.add(valor);
      const novo = { ...prev };
      if (atual.size >= todos.length) delete novo[chave];
      else novo[chave] = atual;
      return novo;
    });
  }

  function marcarValores(chave: string, valores: string[]) {
    setFiltros((prev) => {
      const todos = (valoresPorColuna.get(chave) ?? []).map((v) => v.valor);
      const atual = new Set(prev[chave] ?? todos);
      valores.forEach((v) => atual.add(v));
      const novo = { ...prev };
      if (atual.size >= todos.length) delete novo[chave];
      else novo[chave] = atual;
      return novo;
    });
  }

  function desmarcarValores(chave: string, valores: string[]) {
    setFiltros((prev) => {
      const todos = (valoresPorColuna.get(chave) ?? []).map((v) => v.valor);
      const atual = new Set(prev[chave] ?? todos);
      valores.forEach((v) => atual.delete(v));
      const novo = { ...prev };
      novo[chave] = atual;
      return novo;
    });
  }

  function limparFiltroColuna(chave: string) {
    setFiltros((prev) => {
      const novo = { ...prev };
      delete novo[chave];
      return novo;
    });
  }

  function limparTodosOsFiltros() {
    setFiltros({});
  }

  function abrirOuFecharFiltro(chave: string) {
    setBusca("");
    setColunaFiltroAberta((atual) => (atual === chave ? null : chave));
  }

  function onDrop(posDestino: number) {
    if (posArrastando === null || posArrastando === posDestino) return;
    setOrdem((prev) => {
      const nova = [...prev];
      const [item] = nova.splice(posArrastando, 1);
      nova.splice(posDestino, 0, item);
      return nova;
    });
    setPosArrastando(null);
  }

  const totalFiltrosAtivos = Object.values(filtros).filter((s) => s.size > 0).length;

  return (
    <div>
      {totalFiltrosAtivos > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2 text-xs text-bwise-texto-sec">
          <span>
            {totalFiltrosAtivos} filtro(s) de coluna ativo(s) — exibindo {linhasFiltradas.length} de {linhas.length} linhas.
          </span>
          <button onClick={limparTodosOsFiltros} className="text-bwise-verde-escuro font-semibold hover:underline text-left">
            Limpar filtros de coluna
          </button>
        </div>
      )}

      <div className="overflow-auto border border-bwise-borda rounded-xl max-h-[70vh]">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-bwise-fundo text-bwise-texto-sec text-xs uppercase tracking-wide">
              {colunasOrdenadas.map((col, pos) => {
                const valoresDisponiveis = valoresPorColuna.get(col.chave) ?? [];
                const filtroAtivo = (filtros[col.chave]?.size ?? 0) > 0;
                const buscaLower = busca.trim().toLowerCase();
                const valoresNaBusca = buscaLower
                  ? valoresDisponiveis.filter((v) => v.valor.toLowerCase().includes(buscaLower))
                  : valoresDisponiveis;

                return (
                  <th
                    key={col.chave}
                    draggable
                    onDragStart={() => setPosArrastando(pos)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(pos)}
                    onDragEnd={() => setPosArrastando(null)}
                    className={`relative px-4 py-3 font-bold whitespace-nowrap select-none sticky top-0 z-10 bg-bwise-fundo cursor-grab active:cursor-grabbing ${
                      posArrastando === pos ? "opacity-40" : ""
                    }`}
                    title="Arraste para reordenar"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.rotulo ?? col.chave}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirOuFecharFiltro(col.chave);
                        }}
                        title="Filtrar coluna"
                        className={`shrink-0 leading-none text-sm ${filtroAtivo ? "text-bwise-verde-escuro" : "text-bwise-texto-sec"}`}
                      >
                        ▾
                      </button>
                    </div>

                    {colunaFiltroAberta === col.chave && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setColunaFiltroAberta(null)} />
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute z-30 top-full left-0 mt-1 w-64 bg-bwise-superficie border border-bwise-borda rounded-xl shadow-2xl normal-case font-normal text-bwise-texto text-left"
                        >
                          <div className="p-3 border-b border-bwise-borda">
                            <input
                              value={busca}
                              onChange={(e) => setBusca(e.target.value)}
                              placeholder="Buscar valor..."
                              className="w-full border border-bwise-borda rounded-lg px-2 py-1.5 text-xs bg-bwise-superficie text-bwise-texto placeholder:text-bwise-texto-sec"
                            />
                            <div className="flex gap-3 mt-2 text-xs">
                              <button
                                onClick={() => marcarValores(col.chave, valoresNaBusca.map((v) => v.valor))}
                                className="text-bwise-verde-escuro font-semibold hover:underline"
                              >
                                Marcar todos
                              </button>
                              <button
                                onClick={() => desmarcarValores(col.chave, valoresNaBusca.map((v) => v.valor))}
                                className="text-bwise-texto-sec font-semibold hover:underline"
                              >
                                Desmarcar todos
                              </button>
                              {filtroAtivo && (
                                <button
                                  onClick={() => limparFiltroColuna(col.chave)}
                                  className="text-bwise-texto-sec font-semibold hover:underline"
                                >
                                  Limpar
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="max-h-56 overflow-y-auto p-1">
                            {valoresNaBusca.length === 0 && (
                              <p className="text-xs text-bwise-texto-sec text-center py-4">Nenhum valor encontrado.</p>
                            )}
                            {valoresNaBusca.map(({ valor, quantidade }) => (
                              <label
                                key={valor}
                                className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-bwise-fundo cursor-pointer text-xs"
                              >
                                <span className="flex items-center gap-2 truncate">
                                  <input
                                    type="checkbox"
                                    checked={!filtros[col.chave] || filtros[col.chave].has(valor)}
                                    onChange={() => alternarValorFiltro(col.chave, valor)}
                                    className="h-3.5 w-3.5 accent-bwise-verde-escuro shrink-0"
                                  />
                                  <span className="truncate">{valor}</span>
                                </span>
                                <span className="text-bwise-texto-sec shrink-0">{quantidade}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {linhasFiltradas.map((linha, idx) => {
              const corDaLinha = corLinha ? corLinha(linha) : null;
              return (
                <tr
                  key={idx}
                  className="border-t border-bwise-borda"
                  style={corDaLinha ? { backgroundColor: corDaLinha.bg, color: corDaLinha.text } : undefined}
                >
                  {colunasOrdenadas.map((col) => {
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
            {linhasFiltradas.length === 0 && (
              <tr>
                <td colSpan={colunasOrdenadas.length} className="px-4 py-8 text-center text-bwise-texto-sec">
                  Nenhum resultado encontrado com os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
