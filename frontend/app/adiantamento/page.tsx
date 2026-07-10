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
  { chave: "Data de Admissão" },
  { chave: "Categoria" },
  { chave: "Salário Base", formato: "moeda" },
  { chave: "Adiantamento Mês Anterior", formato: "moeda" },
  { chave: "Adiantamento Mês Atual", formato: "moeda" },
  { chave: "Diferença Entre Meses", formato: "moeda" },
  { chave: "Status" },
  { chave: "Motivo / Erros" },
];

const STATUS_OPCOES = [
  "Todos",
  "Certo",
  "Certo (Férias)",
  "Errado",
  "Funcionário Novo",
  "Sem adiantamento (opcional)",
  "Não tem direito (admitido após dia 6)",
];

const ISENTOS = ["Funcionário Novo", "Sem adiantamento (opcional)", "Não tem direito (admitido após dia 6)"];

function corPorStatus(status: string): CorConfig | null {
  if (status.includes("Certo")) return { bg: "#d4edda", text: "#155724" };
  if (status === "Errado") return { bg: "#f8d7da", text: "#721c24" };
  if (status === "Funcionário Novo") return { bg: "#cce5ff", text: "#004085" };
  if (status === "Não tem direito (admitido após dia 6)") return { bg: "#fff3cd", text: "#856404" };
  return { bg: "#e2e3e5", text: "#383d41" };
}

export default function AdiantamentoPage() {
  const router = useRouter();
  const [arqEventos, setArqEventos] = useState<File | null>(null);
  const [arqAtivos, setArqAtivos] = useState<File | null>(null);
  const [arqFerias, setArqFerias] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const [resultados, setResultados] = useState<Record<string, any>[] | null>(null);
  const [meta, setMeta] = useState<Record<string, any> | null>(null);

  const [filtroNome, setFiltroNome] = useState("");
  const [filtroMatricula, setFiltroMatricula] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  const handleAuditarAdiantamento = async () => {
    if (!arqEventos || !arqAtivos || !arqFerias) return;
    setCarregando(true);
    setResultados(null);
    setMeta(null);

    const formData = new FormData();
    formData.append("arquivo_eventos", arqEventos);
    formData.append("arquivo_ativos", arqAtivos);
    formData.append("arquivo_ferias", arqFerias);

    try {
      const resposta = await fetch(`${API_BASE_URL}/api/auditoria-adiantamento`, {
        method: "POST",
        body: formData,
      });

      if (!resposta.ok) {
        const erro = await resposta.json().catch(() => null);
        throw new Error(erro?.detail || "Erro ao processar auditoria de adiantamentos.");
      }

      const dados = await resposta.json();
      setResultados(dados.resultados);
      setMeta(dados.meta);
      setFiltroNome("");
      setFiltroMatricula("");
      setFiltroStatus("Todos");
    } catch (erro: any) {
      alert(erro.message || "Erro de conexão com o motor.");
    } finally {
      setCarregando(false);
    }
  };

  const resultadosFiltrados = useMemo(() => {
    if (!resultados) return [];
    return resultados.filter((r) => {
      if (filtroStatus !== "Todos" && String(r["Status"]) !== filtroStatus) return false;
      if (filtroNome.trim() && !String(r["Funcionário"] ?? "").toLowerCase().includes(filtroNome.trim().toLowerCase())) return false;
      if (filtroMatricula.trim() && !String(r["Matrícula"] ?? "").toLowerCase().includes(filtroMatricula.trim().toLowerCase())) return false;
      return true;
    });
  }, [resultados, filtroStatus, filtroNome, filtroMatricula]);

  const metrics = useMemo(() => {
    if (!resultados) return [];
    const ativos = resultados.length;
    const corretos = resultados.filter((r) => String(r["Status"]).includes("Certo")).length;
    const divergentes = resultados.filter((r) => r["Status"] === "Errado").length;
    const isentos = resultados.filter((r) => ISENTOS.includes(String(r["Status"]))).length;
    return [
      { label: "Ativos", value: ativos },
      { label: "Corretos", value: corretos },
      { label: "Com Divergência", value: divergentes },
      { label: "Isentos (Novos/Opcional)", value: isentos },
    ];
  }, [resultados]);

  const handleBaixarExcel = async () => {
    if (!meta) return;
    setBaixando(true);
    try {
      const resposta = await fetch(`${API_BASE_URL}/api/auditoria-adiantamento/excel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultados: resultadosFiltrados, meta }),
      });
      if (!resposta.ok) throw new Error("Erro ao gerar a planilha.");
      const blob = await resposta.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Conferencia_Adiantamentos_Mes_${meta.mes_atu}.xlsx`;
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
          <h2 className="text-4xl font-extrabold text-bwise-texto tracking-tight">Auditoria de Adiantamento Salarial</h2>
          <p className="text-bwise-texto-sec mt-2 text-lg">Suba as planilhas para auditar a proporcionalidade matemática exata e gerar relatórios executivos.</p>
        </div>

        <PassoAPasso titulo="Como extrair as planilhas do KMM (Passo a Passo)">
          <div>
            <h4 className="font-bold text-bwise-texto mb-2">1. LISTA DE EVENTOS DE RECIBO DE PAGAMENTO</h4>
            <p className="mb-2"><strong>Caminho:</strong> Folha de Pagamento ➔ Folha de Pagamento ➔ Lista de Eventos de Recibos de Pagamento...</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Competência Inicial:</strong> último adiantamento processado (mês anterior).</li>
              <li><strong>Competência Final:</strong> adiantamento atual que está validando (mês atual).</li>
              <li><strong>Tipo de Recibo:</strong> 2 Adiantamento.</li>
              <li>Clicar em <strong>&quot;Filtrar&quot;</strong> e salvar.</li>
            </ul>
          </div>
          <hr className="border-bwise-borda" />
          <div>
            <h4 className="font-bold text-bwise-texto mb-2">2. LISTA DE FUNCIONÁRIOS ATIVOS</h4>
            <p className="mb-2"><strong>Caminho:</strong> Folha de Pagamento ➔ Funcionários ➔ Registro...</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Clicar em <strong>&quot;Listar...&quot;</strong>.</li>
              <li><strong>Situação:</strong> Ativos.</li>
              <li>Clicar em <strong>&quot;Filtrar&quot;</strong> e salvar.</li>
            </ul>
          </div>
          <hr className="border-bwise-borda" />
          <div>
            <h4 className="font-bold text-bwise-texto mb-2">3. LISTA DE PERÍODOS AQUISITIVOS E CONCESSIVOS (FÉRIAS)</h4>
            <p className="mb-2"><strong>Caminho:</strong> Folha de Pagamento ➔ Férias ➔ Lista de Períodos Aquisitivos e Concessivos...</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Clicar em <strong>&quot;Filtrar&quot;</strong> e salvar.</li>
            </ul>
          </div>
        </PassoAPasso>

        <div className="bg-bwise-superficie rounded-3xl shadow-xl border border-bwise-borda p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col">
              <span className="font-bold text-bwise-texto mb-2 block text-left">1. Arquivo de Eventos (.xlsx/.csv)</span>
              <label className={`flex flex-col items-center justify-center h-44 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${arqEventos ? 'bg-bwise-verde-claro border-bwise-verde' : 'bg-bwise-uploader-fundo border-bwise-uploader-borda hover:border-bwise-verde'}`}>
                <div className="flex flex-col items-center p-4 text-center">
                  <span className="text-3xl mb-2">📜</span>
                  <p className="text-xs font-medium text-bwise-texto-sec break-all">{arqEventos ? arqEventos.name : "Eventos de Recibo"}</p>
                </div>
                <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => e.target.files && setArqEventos(e.target.files[0])} />
              </label>
            </div>

            <div className="flex flex-col">
              <span className="font-bold text-bwise-texto mb-2 block text-left">2. Cadastro de Funcionários Ativos (.xlsx)</span>
              <label className={`flex flex-col items-center justify-center h-44 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${arqAtivos ? 'bg-bwise-verde-claro border-bwise-verde' : 'bg-bwise-uploader-fundo border-bwise-uploader-borda hover:border-bwise-verde'}`}>
                <div className="flex flex-col items-center p-4 text-center">
                  <span className="text-3xl mb-2">👥</span>
                  <p className="text-xs font-medium text-bwise-texto-sec break-all">{arqAtivos ? arqAtivos.name : "Lista de Ativos"}</p>
                </div>
                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={(e) => e.target.files && setArqAtivos(e.target.files[0])} />
              </label>
            </div>

            <div className="flex flex-col">
              <span className="font-bold text-bwise-texto mb-2 block text-left">3. Relatório de Férias do Mês (.xlsx)</span>
              <label className={`flex flex-col items-center justify-center h-44 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${arqFerias ? 'bg-bwise-verde-claro border-bwise-verde' : 'bg-bwise-uploader-fundo border-bwise-uploader-borda hover:border-bwise-verde'}`}>
                <div className="flex flex-col items-center p-4 text-center">
                  <span className="text-3xl mb-2">🏖️</span>
                  <p className="text-xs font-medium text-bwise-texto-sec break-all">{arqFerias ? arqFerias.name : "Férias Gozadas no Mês"}</p>
                </div>
                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={(e) => e.target.files && setArqFerias(e.target.files[0])} />
              </label>
            </div>
          </div>

          <div className="border-t border-bwise-borda pt-6 flex justify-end">
            <button
              onClick={handleAuditarAdiantamento}
              disabled={!arqEventos || !arqAtivos || !arqFerias || carregando}
              className="px-8 py-4 bg-bwise-verde hover:bg-bwise-verde-escuro disabled:bg-bwise-borda disabled:text-bwise-texto-sec text-[#0B2015] font-extrabold rounded-xl shadow-lg transition-colors"
            >
              {carregando ? "Processando..." : "Iniciar Auditoria de Adiantamento 🚀"}
            </button>
          </div>
        </div>

        {resultados && meta && (
          <div className="bg-bwise-superficie rounded-3xl shadow-xl border border-bwise-borda p-8">
            <h3 className="text-xl font-bold text-bwise-texto mb-1">
              Comparando Mês {meta.mes_ant} x Mês {meta.mes_atu}
            </h3>
            <p className="text-sm text-bwise-texto-sec mb-4">Dados processados com sucesso.</p>
            <MetricsRow metrics={metrics} />

            <h3 className="text-lg font-bold text-bwise-texto mb-3">Filtros de Busca</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              <input
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
                placeholder="Buscar por Nome"
                className="border border-bwise-borda rounded-lg px-3 py-2 text-sm bg-bwise-superficie text-bwise-texto placeholder:text-bwise-texto-sec"
              />
              <input
                value={filtroMatricula}
                onChange={(e) => setFiltroMatricula(e.target.value)}
                placeholder="Buscar por Matrícula"
                className="border border-bwise-borda rounded-lg px-3 py-2 text-sm bg-bwise-superficie text-bwise-texto placeholder:text-bwise-texto-sec"
              />
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="border border-bwise-borda rounded-lg px-3 py-2 text-sm bg-bwise-superficie text-bwise-texto"
              >
                {STATUS_OPCOES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-bwise-texto-sec mb-4">
              A exibir {resultadosFiltrados.length} de {resultados.length} funcionários
            </p>

            <DataTable
              colunas={COLUNAS}
              linhas={resultadosFiltrados}
              colunaComCorPropria="Status"
              corCelula={(valor) => corPorStatus(String(valor))}
            />

            <div className="flex justify-end mt-6">
              <button
                onClick={handleBaixarExcel}
                disabled={baixando || resultadosFiltrados.length === 0}
                className="px-6 py-3 bg-bwise-verde hover:bg-bwise-verde-escuro disabled:bg-bwise-borda disabled:text-bwise-texto-sec text-[#0B2015] font-bold rounded-xl shadow transition-colors"
              >
                {baixando ? "Gerando planilha..." : "Baixar Tabela de Conferência (Excel Formatado)"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
