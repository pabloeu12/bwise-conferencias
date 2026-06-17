"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FeriasPage() {
  const router = useRouter();
  const [sidebarAberta, setSidebarAberta] = useState(true);
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
      const resposta = await fetch("http://127.0.0.1:8000/api/auditoria-ferias", {
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
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* BARRA LATERAL (SIDEBAR) */}
      <aside className={`${sidebarAberta ? "w-64" : "w-20"} bg-[#1e212b] flex flex-col shadow-2xl relative overflow-hidden z-20 transition-all duration-300 ease-in-out`}>
        <div className="absolute -bottom-32 -left-16 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Topo da Sidebar: Logo + Botão de Recolher */}
        <div className={`p-6 pb-4 flex ${sidebarAberta ? "justify-between" : "justify-center"} items-center border-b border-slate-700/30`}>
          {sidebarAberta && (
            <a href="https://www.bwisecontabilidade.com/" target="_blank" rel="noopener noreferrer" className="cursor-pointer transition-opacity hover:opacity-80">
              <img src="/logo.png" alt="Bwise Logo" className="w-28 object-contain" />
            </a>
          )}
          <button 
            onClick={() => setSidebarAberta(!sidebarAberta)} 
            className="p-2 rounded-xl bg-slate-800 text-emerald-400 hover:bg-slate-700 transition-colors focus:outline-none"
            title={sidebarAberta ? "Recolher Barra" : "Expandir Barra"}
          >
            {sidebarAberta ? "❮" : "❯"}
          </button>
        </div>

        {/* Menu de Navegação Interativo */}
        <nav className="flex-1 px-3 py-8 space-y-3 relative z-10">
          <button onClick={() => router.push("/")} className="w-full flex items-center gap-4 px-4 py-3 text-emerald-400 bg-emerald-400/5 hover:bg-emerald-400/20 rounded-r-full font-medium transition-colors text-left">
            <span>🏠</span>{sidebarAberta && <span>Início</span>}
          </button>
          <button onClick={() => router.push("/rubricas")} className="w-full flex items-center gap-4 px-4 py-3 text-emerald-400 bg-emerald-400/5 hover:bg-emerald-400/20 rounded-r-full font-medium transition-colors text-left">
            <span>📊</span>{sidebarAberta && <span>Rubricas</span>}
          </button>
          <button onClick={() => router.push("/adiantamento")} className="w-full flex items-center gap-4 px-4 py-3 text-emerald-400 bg-emerald-400/5 hover:bg-emerald-400/20 rounded-r-full font-medium transition-colors text-left">
            <span>💵</span>{sidebarAberta && <span>Adiantamento</span>}
          </button>
          <button onClick={() => router.push("/ferias")} className="w-full flex items-center gap-4 px-4 py-3 bg-emerald-400 text-[#1e212b] rounded-r-full font-bold shadow-[0_0_15px_rgba(52,211,153,0.4)] text-left">
            <span>🏖️</span>{sidebarAberta && <span>Férias</span>}
          </button>
        </nav>
      </aside>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto flex flex-col">
          <div className="mb-8 text-left">
            <button onClick={() => router.push("/")} className="inline-flex items-center text-emerald-600 font-bold hover:text-emerald-500 transition-colors mb-4">
              <span className="mr-2">←</span> Voltar para o Painel
            </button>
            <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">Auditoria de Recibo de Férias</h2>
            <p className="text-slate-500 mt-2 text-lg">Valide as médias de variáveis do período aquisitivo e os cálculos de terço constitucional aplicando reajustes salariais históricos.</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              
              {/* Campo 1: PDF */}
              <div className="flex flex-col">
                <span className="font-bold text-slate-700 mb-2 block text-left">1. Recibo de Férias (.pdf)</span>
                <label className={`flex flex-col items-center justify-center h-44 border-2 border-dashed rounded-xl cursor-pointer transition-all ${pdfFerias ? 'bg-emerald-50/50 border-emerald-400' : 'bg-slate-50 border-slate-300 hover:bg-slate-100'}`}>
                  <div className="flex flex-col items-center p-4 text-center">
                    <span className="text-3xl mb-2">📄</span>
                    <p className="text-xs font-medium text-slate-600 break-all">{pdfFerias ? pdfFerias.name : "Anexar Recibo Individual"}</p>
                  </div>
                  <input type="file" className="hidden" accept=".pdf" onChange={(e) => e.target.files && setPdfFerias(e.target.files[0])} />
                </label>
              </div>

              {/* Campo 2: Eventos */}
              <div className="flex flex-col">
                <span className="font-bold text-slate-700 mb-2 block text-left">2. Lista de Eventos (.xlsx/.csv)</span>
                <label className={`flex flex-col items-center justify-center h-44 border-2 border-dashed rounded-xl cursor-pointer transition-all ${arqEventos ? 'bg-emerald-50/50 border-emerald-400' : 'bg-slate-50 border-slate-300 hover:bg-slate-100'}`}>
                  <div className="flex flex-col items-center p-4 text-center">
                    <span className="text-3xl mb-2">📜</span>
                    <p className="text-xs font-medium text-slate-600 break-all">{arqEventos ? arqEventos.name : "Lista de Eventos de Recibo"}</p>
                  </div>
                  <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => e.target.files && setArqEventos(e.target.files[0])} />
                </label>
              </div>

              {/* Campo 3: Histórico de Salários */}
              <div className="flex flex-col">
                <span className="font-bold text-slate-700 mb-2 block text-left">3. Histórico de Cargos (.xlsx/.csv)</span>
                <label className={`flex flex-col items-center justify-center h-44 border-2 border-dashed rounded-xl cursor-pointer transition-all ${arqHistorico ? 'bg-emerald-50/50 border-emerald-400' : 'bg-slate-50 border-slate-300 hover:bg-slate-100'}`}>
                  <div className="flex flex-col items-center p-4 text-center">
                    <span className="text-3xl mb-2">📈</span>
                    <p className="text-xs font-medium text-slate-600 break-all">{arqHistorico ? arqHistorico.name : "Histórico de Reajustes"}</p>
                  </div>
                  <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => e.target.files && setArqHistorico(e.target.files[0])} />
                </label>
              </div>

            </div>

            <div className="border-t border-slate-100 pt-6 flex justify-end">
              <button 
                onClick={handleAuditarFerias}
                disabled={!pdfFerias || !arqEventos || !arqHistorico || carregando}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-extrabold rounded-xl shadow-lg transition-colors flex items-center gap-3"
              >
                {carregando ? "Processando e Atualizando Médias..." : "Iniciar Conferência de Férias 🚀"}
              </button>
            </div>
          </div>

          {/* PAINEL DE RESULTADOS EM TEMPO REAL */}
          {resultado && (
            <div className="w-full text-left bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-8 animate-fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-2xl font-bold text-slate-800">📋 Resumo Contratual Apurado</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div className="bg-slate-50 p-4 rounded-xl"><p className="text-xs text-slate-400 font-bold">MATRÍCULA</p><p className="text-lg font-black text-slate-700">{resultado.matricula}</p></div>
                  <div className="bg-slate-50 p-4 rounded-xl"><p className="text-xs text-slate-400 font-bold">SALÁRIO CONTRATUAL</p><p className="text-lg font-black text-emerald-600">R$ {resultado.salario_contratual.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                  <div className="bg-slate-50 p-4 rounded-xl"><p className="text-xs text-slate-400 font-bold">PERÍODO AQUISITIVO</p><p className="text-sm font-bold text-slate-600 mt-1">{resultado.periodo_aquisitivo}</p></div>
                </div>
              </div>

              {/* Itens do Recibo */}
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">1. Verificação de Férias e Abono Base</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {resultado.verificacoes_base.map((v: any, idx: number) => (
                    <div key={idx} className="border border-slate-100 rounded-2xl p-6 bg-slate-50/50">
                      <span className="text-xs font-bold bg-slate-200 px-2.5 py-1 rounded-md text-slate-700">{v.evento}</span>
                      <p className="text-sm font-bold text-slate-500 mt-3">Fórmula: <span className="text-slate-700 font-mono">{v.formula}</span></p>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                        <div><p className="text-xs text-slate-400 font-bold">CÁLCULO SISTEMA</p><p className="text-base font-extrabold text-slate-700">R$ {v.calculado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                        <div><p className="text-xs text-slate-400 font-bold">VALOR NO PDF</p><p className="text-base font-extrabold text-slate-700">R$ {v.pdf.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                        <div><p className="text-xs text-slate-400 font-bold">DIFERENÇA</p><p className={`text-base font-black ${v.diferenca === 0 ? 'text-emerald-500' : 'text-rose-500'}`}>R$ {v.diferenca.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Médias de Variáveis */}
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">2. Análise de Variáveis do Período</h3>
                <p className="text-sm text-slate-400 mb-4">Mapeamento dos eventos de variáveis com reajustes proporcionais automáticos com base nas tabelas salariais de época.</p>
                
                <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 font-mono text-xs space-y-1.5 max-h-60 overflow-y-auto mb-6">
                  {resultado.detalhes_medias.map((det: string, idx: number) => (
                    <p key={idx} className="text-left">{det}</p>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl"><p className="text-xs text-emerald-600 font-bold">SOMA PROVENTOS HISTÓRICOS CORRIGIDOS</p><p className="text-xl font-black text-emerald-700">R$ {resultado.total_proventos_atualizados.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl"><p className="text-xs text-emerald-600 font-bold">MÉDIA MENSAL APURADA (DIVIDIDO POR 12)</p><p className="text-xl font-black text-emerald-700">R$ {resultado.media_mensal_apurada.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                </div>

                {/* Resultados das Médias */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {resultado.verificacoes_medias.map((v: any, idx: number) => (
                    <div key={idx} className="border border-emerald-100/50 rounded-2xl p-6 bg-emerald-50/20">
                      <span className="text-xs font-bold bg-emerald-100 px-2.5 py-1 rounded-md text-emerald-700">{v.evento}</span>
                      <p className="text-sm font-bold text-slate-500 mt-3">Fórmula: <span className="text-slate-700 font-mono">{v.formula}</span></p>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                        <div><p className="text-xs text-slate-400 font-bold">MÉDIA SISTEMA</p><p className="text-base font-extrabold text-slate-700">R$ {v.calculado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                        <div><p className="text-xs text-slate-400 font-bold">VALOR NO PDF</p><p className="text-base font-extrabold text-slate-700">R$ {v.pdf.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                        <div><p className="text-xs text-slate-400 font-bold">DIFERENÇA</p><p className={`text-base font-black ${v.diferenca === 0 ? 'text-emerald-500' : 'text-rose-500'}`}>R$ {v.diferenca.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}