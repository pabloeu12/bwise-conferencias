"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, mensagemDeErro } from "../../lib/api";
import { LinhaResultado, MetaConsignados } from "../../lib/types";
import PassoAPasso from "../components/PassoAPasso";
import Topbar from "../components/Topbar";
import MetricsRow from "../components/MetricsRow";
import DataTable, { ColunaConfig, CorConfig } from "../components/DataTable";

const COLUNAS: ColunaConfig[] = [
  { chave: "Matrícula" },
  { chave: "Nome do funcionário" },
  { chave: "Base de Cálculo do INSS", formato: "moeda" },
  { chave: "Valor do INSS", formato: "moeda" },
  { chave: "Valor do IRRF", formato: "moeda" },
  { chave: "Férias", formato: "moeda" },
  { chave: "Base", formato: "moeda" },
  { chave: "Limite de Desconto (35%)", formato: "moeda" },
  { chave: "EMPRESTIMO (EMPREGA BRASIL)", formato: "moeda" },
  { chave: "EMPRESTIMO (LISTA DE EVENTOS DE RECIBO DE PAGAMENTO)", formato: "moeda" },
  { chave: "Diferença (Emprega Brasil x Lista de Eventos)", formato: "moeda" },
  { chave: "Diferença (Limite de Desconto x Lista de Eventos)", formato: "moeda" },
  { chave: "Status" },
  { chave: "Observação" },
];

function corPorStatus(status: string): CorConfig {
  if (status === "Certo") return { bg: "#d4edda", text: "#155724" };
  return { bg: "#f8d7da", text: "#721c24" };
}

export default function ConsignadosPage() {
  const router = useRouter();
  const [arqEmprega, setArqEmprega] = useState<File | null>(null);
  const [arqRecibos, setArqRecibos] = useState<File | null>(null);
  const [arqEventos, setArqEventos] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const [resultados, setResultados] = useState<LinhaResultado[] | null>(null);
  const [meta, setMeta] = useState<MetaConsignados | null>(null);

  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroMatricula, setFiltroMatricula] = useState("");

  const handleAuditarConsignados = async () => {
    if (!arqEmprega || !arqRecibos || !arqEventos) return;
    setCarregando(true);
    setResultados(null);
    setMeta(null);

    const formData = new FormData();
    formData.append("arquivo_emprega", arqEmprega);
    formData.append("arquivo_recibos", arqRecibos);
    formData.append("arquivo_eventos", arqEventos);

    try {
      const resposta = await fetch(`${API_BASE_URL}/api/auditoria-consignados`, {
        method: "POST",
        body: formData,
      });

      if (!resposta.ok) {
        const erro = await resposta.json().catch(() => null);
        throw new Error(erro?.detail || "Erro ao processar a conferência de consignados.");
      }

      const dados = await resposta.json();
      setResultados(dados.resultados);
      setMeta(dados.meta);
      setFiltroStatus("Todos");
      setFiltroNome("");
      setFiltroMatricula("");
    } catch (erro) {
      alert(mensagemDeErro(erro, "Erro de conexão com o motor."));
    } finally {
      setCarregando(false);
    }
  };

  const resultadosFiltrados = useMemo(() => {
    if (!resultados) return [];
    return resultados.filter((r) => {
      if (filtroStatus !== "Todos" && String(r["Status"]) !== filtroStatus) return false;
      if (filtroNome.trim() && !String(r["Nome do funcionário"] ?? "").toLowerCase().includes(filtroNome.trim().toLowerCase())) return false;
      if (filtroMatricula.trim() && !String(r["Matrícula"] ?? "").toLowerCase().includes(filtroMatricula.trim().toLowerCase())) return false;
      return true;
    });
  }, [resultados, filtroStatus, filtroNome, filtroMatricula]);

  const metrics = useMemo(() => {
    if (!meta) return [];
    return [
      { label: "Funcionários Processados", value: meta.total_funcionarios },
      { label: "Corretos", value: meta.total_corretos },
      { label: "Com Divergência", value: meta.total_errados },
      { label: "Limites 35% Ultrapassados", value: meta.limites_ultrapassados },
    ];
  }, [meta]);

  const handleBaixarExcel = async () => {
    if (!meta || !resultados) return;
    setBaixando(true);
    try {
      const resposta = await fetch(`${API_BASE_URL}/api/auditoria-consignados/excel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultados, meta }),
      });
      if (!resposta.ok) throw new Error("Erro ao gerar a planilha.");
      const blob = await resposta.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Resultado_Conferencia_Consignados.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (erro) {
      alert(mensagemDeErro(erro, "Erro ao baixar a planilha."));
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
          <h2 className="text-4xl font-extrabold text-bwise-texto tracking-tight">Conferência de Consignados</h2>
          <p className="text-bwise-texto-sec mt-2 text-lg">Suba os três arquivos para validar os descontos de empréstimos consignados e o limite de 35% da margem.</p>
        </div>

        <PassoAPasso titulo="Como extrair os documentos do sistema (Passo a Passo)">
          <div>
            <h4 className="font-bold text-bwise-texto mb-2">1. EMPREGA BRASIL</h4>
            <p className="italic">Espaço reservado para inclusão dos passos futuramente.</p>
          </div>
          <hr className="border-bwise-borda" />
          <div>
            <h4 className="font-bold text-bwise-texto mb-2">2. LISTA DE RECIBO DE PAGAMENTO</h4>
            <p className="mb-2"><strong>Caminho:</strong> Folha de Pagamento ➔ Folha de Pagamento ➔ Lista de Recibos de Pagamento...</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Competência Inicial e Competência Final:</strong> selecionar o mês atual.</li>
              <li><strong>Tipo de Recibo:</strong> 1 Normal.</li>
              <li>Clique em <strong>Filtrar</strong> e salve o arquivo nos formatos <strong>.CSV</strong>, <strong>.XLS</strong> ou <strong>.XLSX</strong>.</li>
            </ul>
          </div>
          <hr className="border-bwise-borda" />
          <div>
            <h4 className="font-bold text-bwise-texto mb-2">3. LISTA DE EVENTOS DE PAGAMENTO</h4>
            <p className="mb-2"><strong>Caminho:</strong> Folha de Pagamento ➔ Folha de Pagamento ➔ Lista de Eventos de Recibos de Pagamento...</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Competência Inicial e Competência Final:</strong> selecionar o mês atual.</li>
              <li><strong>Tipo de Recibo:</strong> 1 Normal.</li>
              <li>Clique em <strong>Filtrar</strong> e salve o arquivo nos formatos <strong>.CSV</strong>, <strong>.XLS</strong> ou <strong>.XLSX</strong>.</li>
            </ul>
          </div>
        </PassoAPasso>

        <div className="bg-bwise-superficie rounded-3xl shadow-xl border border-bwise-borda p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col">
              <span className="font-bold text-bwise-texto mb-2 block text-left">1. Emprega Brasil (.xlsx/.csv)</span>
              <label className={`flex flex-col items-center justify-center h-44 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${arqEmprega ? 'bg-bwise-verde-claro border-bwise-verde' : 'bg-bwise-uploader-fundo border-bwise-uploader-borda hover:border-bwise-verde'}`}>
                <div className="flex flex-col items-center p-4 text-center">
                  <span className="text-3xl mb-2">🏦</span>
                  <p className="text-xs font-medium text-bwise-texto-sec break-all">{arqEmprega ? arqEmprega.name : "Extrato Emprega Brasil"}</p>
                </div>
                <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => e.target.files && setArqEmprega(e.target.files[0])} />
              </label>
            </div>

            <div className="flex flex-col">
              <span className="font-bold text-bwise-texto mb-2 block text-left">2. Lista de Recibo de Pagamento (.xlsx/.csv)</span>
              <label className={`flex flex-col items-center justify-center h-44 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${arqRecibos ? 'bg-bwise-verde-claro border-bwise-verde' : 'bg-bwise-uploader-fundo border-bwise-uploader-borda hover:border-bwise-verde'}`}>
                <div className="flex flex-col items-center p-4 text-center">
                  <span className="text-3xl mb-2">🧾</span>
                  <p className="text-xs font-medium text-bwise-texto-sec break-all">{arqRecibos ? arqRecibos.name : "Recibo de Pagamento"}</p>
                </div>
                <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => e.target.files && setArqRecibos(e.target.files[0])} />
              </label>
            </div>

            <div className="flex flex-col">
              <span className="font-bold text-bwise-texto mb-2 block text-left">3. Lista de Eventos de Pagamento (.xlsx/.csv)</span>
              <label className={`flex flex-col items-center justify-center h-44 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${arqEventos ? 'bg-bwise-verde-claro border-bwise-verde' : 'bg-bwise-uploader-fundo border-bwise-uploader-borda hover:border-bwise-verde'}`}>
                <div className="flex flex-col items-center p-4 text-center">
                  <span className="text-3xl mb-2">📜</span>
                  <p className="text-xs font-medium text-bwise-texto-sec break-all">{arqEventos ? arqEventos.name : "Lista de Eventos"}</p>
                </div>
                <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => e.target.files && setArqEventos(e.target.files[0])} />
              </label>
            </div>
          </div>

          <div className="border-t border-bwise-borda pt-6 flex justify-end">
            <button
              onClick={handleAuditarConsignados}
              disabled={!arqEmprega || !arqRecibos || !arqEventos || carregando}
              className="px-8 py-4 bg-bwise-verde hover:bg-bwise-verde-escuro disabled:bg-bwise-borda disabled:text-bwise-texto-sec text-[#0B2015] font-extrabold rounded-xl shadow-lg transition-colors"
            >
              {carregando ? "Processando Conferência..." : "Iniciar Conferência de Consignados 🚀"}
            </button>
          </div>
        </div>

        {resultados && meta && (
          <div className="bg-bwise-superficie rounded-3xl shadow-xl border border-bwise-borda p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h3 className="text-xl font-bold text-bwise-texto">Resumo Geral</h3>
              <button
                onClick={handleBaixarExcel}
                disabled={baixando}
                className="px-6 py-3 bg-bwise-verde hover:bg-bwise-verde-escuro disabled:bg-bwise-borda disabled:text-bwise-texto-sec text-[#0B2015] font-bold rounded-xl shadow transition-colors shrink-0"
              >
                {baixando ? "Gerando planilha..." : "Baixar Conferência de Consignados"}
              </button>
            </div>
            <MetricsRow metrics={metrics} />

            <h3 className="text-lg font-bold text-bwise-texto mb-3">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="border border-bwise-borda rounded-lg px-3 py-2 text-sm bg-bwise-superficie text-bwise-texto"
              >
                <option value="Todos">Todos</option>
                <option value="Certo">Certo</option>
                <option value="Errado">Errado</option>
              </select>
              <input
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
                placeholder="Funcionário"
                className="border border-bwise-borda rounded-lg px-3 py-2 text-sm bg-bwise-superficie text-bwise-texto placeholder:text-bwise-texto-sec"
              />
              <input
                value={filtroMatricula}
                onChange={(e) => setFiltroMatricula(e.target.value)}
                placeholder="Matrícula"
                className="border border-bwise-borda rounded-lg px-3 py-2 text-sm bg-bwise-superficie text-bwise-texto placeholder:text-bwise-texto-sec"
              />
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
          </div>
        )}
      </div>
    </main>
  );
}
