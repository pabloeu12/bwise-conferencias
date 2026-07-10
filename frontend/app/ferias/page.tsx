"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../../lib/api";
import PassoAPasso from "../components/PassoAPasso";

export default function FeriasPage() {
  const router = useRouter();
  const [pdfFerias, setPdfFerias] = useState<File | null>(null);
  const [arqEventos, setArqEventos] = useState<File | null>(null);
  const [arqHistorico, setArqHistorico] = useState<File | null>(null);
  const [resultado, setResultado] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);

  const handleAuditarFerias = async () => {
    if (!pdfFerias || !arqEventos || !arqHistorico) return;
    setCarregando(true);
    setResultado(null);

    const formData = new FormData();
    formData.append("pdf_ferias", pdfFerias);
    formData.append("arquivo_eventos", arqEventos);
    formData.append("arquivo_historico", arqHistorico);

    try {
      const resposta = await fetch(`${API_BASE_URL}/api/auditoria-ferias`, {
        method: "POST",
        body: formData,
      });

      if (!resposta.ok) {
        throw new Error("Erro ao processar os relatórios de férias no motor Python.");
      }

      const dados = await resposta.json();
      setResultado(dados);
    } catch (erro: any) {
      alert(erro.message || "Erro de conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="flex-1 p-12 overflow-y-auto">
      <div className="max-w-5xl mx-auto flex flex-col">
        <div className="mb-8 text-left">
          <button onClick={() => router.push("/")} className="inline-flex items-center text-bwise-verde-escuro font-bold hover:text-bwise-verde transition-colors mb-4">
            <span className="mr-2">←</span> Voltar para o Painel
          </button>
          <h2 className="text-4xl font-extrabold text-bwise-texto tracking-tight">Auditoria de Recibo de Férias</h2>
          <p className="text-bwise-texto-sec mt-2 text-lg">Valide as médias de variáveis do período aquisitivo e os cálculos de terço constitucional aplicando reajustes salariais históricos.</p>
        </div>

        <PassoAPasso titulo="Como extrair os documentos do sistema (Passo a Passo)">
          <div>
            <h4 className="font-bold text-bwise-texto mb-2">1. RECIBO DE FÉRIAS (PDF)</h4>
            <p className="mb-2"><strong>Caminho:</strong> Férias ➔ Controle de Período Aquisitivo e Concessivo ➔ Impressão de Documentos...</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Clicar em <strong>Avançar</strong> ➔ selecionar funcionário ➔ selecionar o último período de férias ➔ <strong>Recibo de Férias</strong>.</li>
              <li>Salvar o arquivo no formato <strong>PDF</strong>.</li>
            </ul>
          </div>
          <hr className="border-bwise-borda" />
          <div>
            <h4 className="font-bold text-bwise-texto mb-2">2. LISTA DE EVENTOS DE RECIBO DE PAGAMENTO</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Competência Inicial e Competência Final:</strong> selecionar o período aquisitivo.</li>
              <li><strong>Tipo de Recibo:</strong> 1 Normal.</li>
              <li>Clicar em <strong>Filtrar</strong> e salvar o arquivo.</li>
            </ul>
          </div>
          <hr className="border-bwise-borda" />
          <div>
            <h4 className="font-bold text-bwise-texto mb-2">3. HISTÓRICO DE CARGOS E SALÁRIOS</h4>
            <p className="mb-2"><strong>Caminho:</strong> Folha de Pagamento ➔ Cadastros ➔ Cargos ➔ Lista de Histórico de Cargos e Salários...</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Situação do funcionário:</strong> Ativos.</li>
              <li>Salvar o arquivo.</li>
            </ul>
          </div>
        </PassoAPasso>

        <div className="bg-bwise-superficie rounded-3xl shadow-xl border border-bwise-borda p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

            {/* Campo 1: PDF */}
            <div className="flex flex-col">
              <span className="font-bold text-bwise-texto mb-2 block text-left">1. Recibo de Férias (.pdf)</span>
              <label className={`flex flex-col items-center justify-center h-44 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${pdfFerias ? 'bg-bwise-verde-claro border-bwise-verde' : 'bg-bwise-uploader-fundo border-bwise-uploader-borda hover:border-bwise-verde'}`}>
                <div className="flex flex-col items-center p-4 text-center">
                  <span className="text-3xl mb-2">📄</span>
                  <p className="text-xs font-medium text-bwise-texto-sec break-all">{pdfFerias ? pdfFerias.name : "Anexar Recibo Individual"}</p>
                </div>
                <input type="file" className="hidden" accept=".pdf" onChange={(e) => e.target.files && setPdfFerias(e.target.files[0])} />
              </label>
            </div>

            {/* Campo 2: Eventos */}
            <div className="flex flex-col">
              <span className="font-bold text-bwise-texto mb-2 block text-left">2. Lista de Eventos (.xlsx/.csv)</span>
              <label className={`flex flex-col items-center justify-center h-44 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${arqEventos ? 'bg-bwise-verde-claro border-bwise-verde' : 'bg-bwise-uploader-fundo border-bwise-uploader-borda hover:border-bwise-verde'}`}>
                <div className="flex flex-col items-center p-4 text-center">
                  <span className="text-3xl mb-2">📜</span>
                  <p className="text-xs font-medium text-bwise-texto-sec break-all">{arqEventos ? arqEventos.name : "Lista de Eventos de Recibo"}</p>
                </div>
                <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => e.target.files && setArqEventos(e.target.files[0])} />
              </label>
            </div>

            {/* Campo 3: Histórico de Salários */}
            <div className="flex flex-col">
              <span className="font-bold text-bwise-texto mb-2 block text-left">3. Histórico de Cargos (.xlsx/.csv)</span>
              <label className={`flex flex-col items-center justify-center h-44 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${arqHistorico ? 'bg-bwise-verde-claro border-bwise-verde' : 'bg-bwise-uploader-fundo border-bwise-uploader-borda hover:border-bwise-verde'}`}>
                <div className="flex flex-col items-center p-4 text-center">
                  <span className="text-3xl mb-2">📈</span>
                  <p className="text-xs font-medium text-bwise-texto-sec break-all">{arqHistorico ? arqHistorico.name : "Histórico de Reajustes"}</p>
                </div>
                <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => e.target.files && setArqHistorico(e.target.files[0])} />
              </label>
            </div>

          </div>

          <div className="border-t border-bwise-borda pt-6 flex justify-end">
            <button
              onClick={handleAuditarFerias}
              disabled={!pdfFerias || !arqEventos || !arqHistorico || carregando}
              className="px-8 py-4 bg-bwise-verde hover:bg-bwise-verde-escuro disabled:bg-bwise-borda disabled:text-bwise-texto-sec text-[#0B2015] font-extrabold rounded-xl shadow-lg transition-colors flex items-center gap-3"
            >
              {carregando ? "Processando e Atualizando Médias..." : "Iniciar Conferência de Férias 🚀"}
            </button>
          </div>
        </div>

        {/* PAINEL DE RESULTADOS EM TEMPO REAL */}
        {resultado && (
          <div className="w-full text-left bg-bwise-superficie rounded-3xl shadow-xl border border-bwise-borda p-8 space-y-8">
            <div className="border-b border-bwise-borda pb-4">
              <h3 className="text-2xl font-bold text-bwise-texto">📋 Resumo Contratual Apurado</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="bg-bwise-fundo p-4 rounded-xl"><p className="text-xs text-bwise-texto-sec font-bold">MATRÍCULA</p><p className="text-lg font-black text-bwise-texto">{resultado.matricula}</p></div>
                <div className="bg-bwise-fundo p-4 rounded-xl"><p className="text-xs text-bwise-texto-sec font-bold">SALÁRIO CONTRATUAL</p><p className="text-lg font-black text-bwise-verde-escuro">R$ {resultado.salario_contratual.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                <div className="bg-bwise-fundo p-4 rounded-xl"><p className="text-xs text-bwise-texto-sec font-bold">PERÍODO AQUISITIVO</p><p className="text-sm font-bold text-bwise-texto-sec mt-1">{resultado.periodo_aquisitivo}</p></div>
              </div>
            </div>

            {/* Itens do Recibo */}
            <div>
              <h3 className="text-xl font-bold text-bwise-texto mb-4">1. Verificação de Férias e Abono Base</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resultado.verificacoes_base.map((v: any, idx: number) => (
                  <div key={idx} className="border border-bwise-borda rounded-2xl p-6 bg-bwise-fundo">
                    <span className="text-xs font-bold bg-bwise-borda px-2.5 py-1 rounded-md text-bwise-texto">{v.evento}</span>
                    <p className="text-sm font-bold text-bwise-texto-sec mt-3">Fórmula: <span className="text-bwise-texto font-mono">{v.formula}</span></p>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-bwise-borda">
                      <div><p className="text-xs text-bwise-texto-sec font-bold">CÁLCULO SISTEMA</p><p className="text-base font-extrabold text-bwise-texto">R$ {v.calculado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                      <div><p className="text-xs text-bwise-texto-sec font-bold">VALOR NO PDF</p><p className="text-base font-extrabold text-bwise-texto">R$ {v.pdf.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                      <div><p className="text-xs text-bwise-texto-sec font-bold">DIFERENÇA</p><p className={`text-base font-black ${v.diferenca === 0 ? 'text-bwise-verde-escuro' : 'text-rose-600'}`}>R$ {v.diferenca.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Médias de Variáveis */}
            <div>
              <h3 className="text-xl font-bold text-bwise-texto mb-2">2. Análise de Variáveis do Período</h3>
              <p className="text-sm text-bwise-texto-sec mb-4">Mapeamento dos eventos de variáveis com reajustes proporcionais automáticos com base nas tabelas salariais de época.</p>

              <div className="bg-bwise-grafite text-bwise-fundo rounded-2xl p-6 font-mono text-xs space-y-1.5 max-h-60 overflow-y-auto mb-6">
                {resultado.detalhes_medias.map((det: string, idx: number) => (
                  <p key={idx} className="text-left">{det}</p>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-bwise-verde-claro border border-bwise-verde/20 p-4 rounded-xl"><p className="text-xs text-bwise-verde-escuro font-bold">SOMA PROVENTOS HISTÓRICOS CORRIGIDOS</p><p className="text-xl font-black text-bwise-verde-escuro">R$ {resultado.total_proventos_atualizados.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                <div className="bg-bwise-verde-claro border border-bwise-verde/20 p-4 rounded-xl"><p className="text-xs text-bwise-verde-escuro font-bold">MÉDIA MENSAL APURADA (DIVIDIDO POR 12)</p><p className="text-xl font-black text-bwise-verde-escuro">R$ {resultado.media_mensal_apurada.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
              </div>

              {/* Resultados das Médias */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resultado.verificacoes_medias.map((v: any, idx: number) => (
                  <div key={idx} className="border border-bwise-verde/20 rounded-2xl p-6 bg-bwise-verde-claro/40">
                    <span className="text-xs font-bold bg-bwise-verde-claro px-2.5 py-1 rounded-md text-bwise-verde-escuro">{v.evento}</span>
                    <p className="text-sm font-bold text-bwise-texto-sec mt-3">Fórmula: <span className="text-bwise-texto font-mono">{v.formula}</span></p>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-bwise-borda">
                      <div><p className="text-xs text-bwise-texto-sec font-bold">MÉDIA SISTEMA</p><p className="text-base font-extrabold text-bwise-texto">R$ {v.calculado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                      <div><p className="text-xs text-bwise-texto-sec font-bold">VALOR NO PDF</p><p className="text-base font-extrabold text-bwise-texto">R$ {v.pdf.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                      <div><p className="text-xs text-bwise-texto-sec font-bold">DIFERENÇA</p><p className={`text-base font-black ${v.diferenca === 0 ? 'text-bwise-verde-escuro' : 'text-rose-600'}`}>R$ {v.diferenca.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
