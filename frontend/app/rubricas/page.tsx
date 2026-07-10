"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../../lib/api";
import PassoAPasso from "../components/PassoAPasso";
import Topbar from "../components/Topbar";
import MetricsRow from "../components/MetricsRow";
import DataTable, { ColunaConfig, CorConfig } from "../components/DataTable";

const COLUNAS: ColunaConfig[] = [
  { chave: "Matrícula" },
  { chave: "Funcionário" },
  { chave: "Código(s) Evento", rotulo: "Código(s) Evento" },
  { chave: "Nome do Evento" },
  { chave: "Valor Lançamento", formato: "moeda" },
  { chave: "Referência Sistema", formato: "moeda" },
  { chave: "Provento Sistema", formato: "moeda" },
  { chave: "Desconto Sistema", formato: "moeda" },
  { chave: "Tipo Identificado" },
  { chave: "Status" },
  { chave: "Observação" },
];

function corPorStatus(status: string): CorConfig | null {
  if (status.includes("OK")) return { bg: "#d4edda", text: "#155724" };
  if (status === "DIVERGENTE") return { bg: "#f8d7da", text: "#721c24" };
  if (status === "NAO_ENCONTRADO") return { bg: "#fff3cd", text: "#856404" };
  if (status === "AUSENTE_NOS_LANCAMENTOS") return { bg: "#ffe0b2", text: "#7a3e00" };
  return null;
}

export default function RubricasPage() {
  const router = useRouter();
  const [arqLancamentos, setArqLancamentos] = useState<File | null>(null);
  const [arqSistema, setArqSistema] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const [resultados, setResultados] = useState<Record<string, any>[] | null>(null);

  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroFuncionario, setFiltroFuncionario] = useState("");
  const [filtroEvento, setFiltroEvento] = useState("Todos");

  const handleAuditarRubricas = async () => {
    if (!arqLancamentos || !arqSistema) return;
    setCarregando(true);
    setResultados(null);

    const formData = new FormData();
    formData.append("arquivo_lanc", arqLancamentos);
    formData.append("arquivo_sist", arqSistema);

    try {
      const resposta = await fetch(`${API_BASE_URL}/api/auditoria-rubricas`, {
        method: "POST",
        body: formData,
      });

      if (!resposta.ok) {
        const erro = await resposta.json().catch(() => null);
        throw new Error(erro?.detail || "Erro ao processar auditoria de rubricas.");
      }

      const dados = await resposta.json();
      setResultados(dados.resultados);
      setFiltroStatus("Todos");
      setFiltroFuncionario("");
      setFiltroEvento("Todos");
    } catch (erro: any) {
      alert(erro.message || "Erro ao conectar com o motor.");
    } finally {
      setCarregando(false);
    }
  };

  const statusDisponiveis = useMemo(() => {
    if (!resultados) return [];
    return Array.from(new Set(resultados.map((r) => String(r["Status"])))).sort();
  }, [resultados]);

  const eventosDisponiveis = useMemo(() => {
    if (!resultados) return [];
    return Array.from(new Set(resultados.map((r) => String(r["Nome do Evento"])))).sort();
  }, [resultados]);

  const resultadosFiltrados = useMemo(() => {
    if (!resultados) return [];
    return resultados.filter((r) => {
      if (filtroStatus !== "Todos" && String(r["Status"]) !== filtroStatus) return false;
      if (filtroEvento !== "Todos" && String(r["Nome do Evento"]) !== filtroEvento) return false;
      if (filtroFuncionario.trim()) {
        const termo = filtroFuncionario.trim().toLowerCase();
        const nome = String(r["Funcionário"] ?? "").toLowerCase();
        const matricula = String(r["Matrícula"] ?? "").toLowerCase();
        if (!nome.includes(termo) && !matricula.includes(termo)) return false;
      }
      return true;
    });
  }, [resultados, filtroStatus, filtroEvento, filtroFuncionario]);

  const metrics = useMemo(() => {
    if (!resultados) return [];
    const total = resultados.length;
    const ok = resultados.filter((r) => String(r["Status"]).startsWith("OK")).length;
    const diverg = resultados.filter((r) => r["Status"] === "DIVERGENTE").length;
    const naoEnc = resultados.filter((r) => r["Status"] === "NAO_ENCONTRADO").length;
    const ausentes = resultados.filter((r) => r["Status"] === "AUSENTE_NOS_LANCAMENTOS").length;
    return [
      { label: "Eventos Comparados", value: total },
      { label: "Conferidos OK", value: ok },
      { label: "Divergências", value: diverg },
      { label: "Não Encontrados no Sistema", value: naoEnc },
      { label: "Ausentes nos Lançamentos", value: ausentes },
    ];
  }, [resultados]);

  const handleBaixarExcel = async () => {
    setBaixando(true);
    try {
      const resposta = await fetch(`${API_BASE_URL}/api/auditoria-rubricas/excel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultados }),
      });
      if (!resposta.ok) throw new Error("Erro ao gerar a planilha.");
      const blob = await resposta.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Conferencia_Rubricas.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (erro: any) {
      alert(erro.message || "Erro ao baixar a planilha.");
    } finally {
      setBaixando(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col overflow-y-auto">
      <Topbar />
      <div className="max-w-6xl mx-auto w-full flex flex-col p-12">
        <div className="mb-8 text-left">
          <button onClick={() => router.push("/")} className="inline-flex items-center text-bwise-verde-escuro font-bold hover:text-bwise-verde transition-colors mb-4">
            <span className="mr-2">←</span> Voltar para o Painel
          </button>
          <h2 className="text-4xl font-extrabold text-bwise-texto tracking-tight">Auditoria de Rubricas</h2>
          <p className="text-bwise-texto-sec mt-2 text-lg">Faça o upload dos dois arquivos necessários para realizar os cruzamentos automatizados.</p>
        </div>

        <PassoAPasso titulo="Como extrair as planilhas do Sistema (Passo a Passo)">
          <div>
            <h4 className="font-bold text-bwise-texto mb-2">PLANILHA DE LANÇAMENTOS</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Origem:</strong> recebemos a planilha da Maçaneiro diretamente via e-mail.</li>
              <li>
                <strong>Divisão:</strong> o arquivo original costuma vir dividido em três partes (<strong>ADM, Motoristas e Manobra</strong>).
                <span className="block text-xs mt-1 ml-4">Nota: você pode optar por unificar as abas/arquivos em uma só ou realizar o processo de conferência de forma separada no sistema.</span>
              </li>
              <li>
                <strong>Ajustes obrigatórios antes de anexar:</strong>
                <ul className="list-[circle] list-inside ml-4 mt-1 space-y-1">
                  <li>Remover completamente todas as fórmulas e formatações de células.</li>
                  <li>Garantir que a <strong>primeira linha</strong> da planilha seja estritamente o cabeçalho, e as linhas seguintes contenham apenas os dados.</li>
                </ul>
              </li>
            </ul>
          </div>
          <hr className="border-bwise-borda" />
          <div>
            <h4 className="font-bold text-bwise-texto mb-2">LISTA DE EVENTOS DE RECIBO DE PAGAMENTO (Sistema)</h4>
            <p><strong>Caminho para extração no sistema:</strong> Folha de Pagamento ➔ Folha de Pagamento ➔ Lista de Eventos de Recibos de Pagamento...</p>
          </div>
        </PassoAPasso>

        <div className="bg-bwise-superficie rounded-3xl shadow-xl border border-bwise-borda p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="flex flex-col">
              <span className="font-bold text-bwise-texto mb-2 block text-left">1. Planilha de Lançamentos (.xlsx / .csv)</span>
              <label className={`flex flex-col items-center justify-center h-44 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${arqLancamentos ? 'bg-bwise-verde-claro border-bwise-verde' : 'bg-bwise-uploader-fundo border-bwise-uploader-borda hover:border-bwise-verde'}`}>
                <div className="flex flex-col items-center p-4 text-center">
                  <span className="text-3xl mb-2">📊</span>
                  <p className="text-xs font-medium text-bwise-texto-sec break-all">{arqLancamentos ? arqLancamentos.name : "Anexar Planilha"}</p>
                </div>
                <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => e.target.files && setArqLancamentos(e.target.files[0])} />
              </label>
            </div>

            <div className="flex flex-col">
              <span className="font-bold text-bwise-texto mb-2 block text-left">2. Planilha do Sistema / Extrato KMM (.xlsx)</span>
              <label className={`flex flex-col items-center justify-center h-44 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${arqSistema ? 'bg-bwise-verde-claro border-bwise-verde' : 'bg-bwise-uploader-fundo border-bwise-uploader-borda hover:border-bwise-verde'}`}>
                <div className="flex flex-col items-center p-4 text-center">
                  <span className="text-3xl mb-2">🖥️</span>
                  <p className="text-xs font-medium text-bwise-texto-sec break-all">{arqSistema ? arqSistema.name : "Anexar Extrato KMM"}</p>
                </div>
                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={(e) => e.target.files && setArqSistema(e.target.files[0])} />
              </label>
            </div>
          </div>

          <div className="border-t border-bwise-borda pt-6 flex justify-end">
            <button
              onClick={handleAuditarRubricas}
              disabled={!arqLancamentos || !arqSistema || carregando}
              className="px-8 py-4 bg-bwise-verde hover:bg-bwise-verde-escuro disabled:bg-bwise-borda disabled:text-bwise-texto-sec text-[#0B2015] font-extrabold rounded-xl shadow-lg transition-colors"
            >
              {carregando ? "Processando Auditoria..." : "Iniciar Cruzamentos de Rubricas 🚀"}
            </button>
          </div>
        </div>

        {resultados && (
          <div className="bg-bwise-superficie rounded-3xl shadow-xl border border-bwise-borda p-8">
            <h3 className="text-xl font-bold text-bwise-texto mb-4">Resultado Geral</h3>
            <MetricsRow metrics={metrics} />

            <h3 className="text-lg font-bold text-bwise-texto mb-3">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="border border-bwise-borda rounded-lg px-3 py-2 text-sm bg-bwise-superficie text-bwise-texto"
              >
                <option value="Todos">Todos os status</option>
                {statusDisponiveis.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                value={filtroFuncionario}
                onChange={(e) => setFiltroFuncionario(e.target.value)}
                placeholder="Funcionário (Nome ou Matrícula)"
                className="border border-bwise-borda rounded-lg px-3 py-2 text-sm bg-bwise-superficie text-bwise-texto placeholder:text-bwise-texto-sec"
              />
              <select
                value={filtroEvento}
                onChange={(e) => setFiltroEvento(e.target.value)}
                className="border border-bwise-borda rounded-lg px-3 py-2 text-sm bg-bwise-superficie text-bwise-texto"
              >
                <option value="Todos">Todos os eventos</option>
                {eventosDisponiveis.map((ev) => (
                  <option key={ev} value={ev}>{ev}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-bwise-texto-sec mb-4">
              A exibir {resultadosFiltrados.length} de {resultados.length} eventos
            </p>

            <DataTable
              colunas={COLUNAS}
              linhas={resultadosFiltrados}
              corLinha={(linha) => corPorStatus(String(linha["Status"]))}
            />

            <div className="flex justify-end mt-6">
              <button
                onClick={handleBaixarExcel}
                disabled={baixando || !resultados || resultados.length === 0}
                className="px-6 py-3 bg-bwise-verde hover:bg-bwise-verde-escuro disabled:bg-bwise-borda disabled:text-bwise-texto-sec text-[#0B2015] font-bold rounded-xl shadow transition-colors"
              >
                {baixando ? "Gerando planilha..." : "Baixar Planilha de Divergências"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
