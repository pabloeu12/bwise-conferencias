"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Banknote, CalendarDays } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [sidebarAberta, setSidebarAberta] = useState(true);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* BARRA LATERAL (SIDEBAR) */}
      <aside className={`${sidebarAberta ? "w-64" : "w-20"} bg-[#1e212b] flex flex-col shadow-2xl relative overflow-hidden z-20 transition-all duration-300 ease-in-out shrink-0`}>
        <div className="absolute -bottom-32 -left-16 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className={`p-6 pb-4 flex ${sidebarAberta ? "justify-between" : "justify-center"} items-center border-b border-slate-700/30`}>
          {sidebarAberta && (
            <a href="https://www.bwisecontabilidade.com/" target="_blank" rel="noopener noreferrer" className="cursor-pointer transition-opacity hover:opacity-80">
              <img src="/logo.png" alt="Bwise Logo" className="w-28 object-contain" />
            </a>
          )}
          <button 
            onClick={() => setSidebarAberta(!sidebarAberta)}
            className="p-2 rounded-xl bg-slate-800 text-emerald-400 hover:bg-slate-700 transition-colors focus:outline-none"
          >
            {sidebarAberta ? "❮" : "❯"}
          </button>
        </div>

        <nav className="flex-1 px-3 py-8 space-y-3 relative z-10">
          <button onClick={() => router.push("/")} className="w-full flex items-center gap-4 px-4 py-3 bg-emerald-400 text-[#1e212b] rounded-r-full font-bold shadow-[0_0_15px_rgba(52,211,153,0.4)] text-left">
            <span>🏠</span>{sidebarAberta && <span>Início</span>}
          </button>
          <button onClick={() => router.push("/rubricas")} className="w-full flex items-center gap-4 px-4 py-3 text-emerald-400 bg-emerald-400/5 hover:bg-emerald-400/20 rounded-r-full font-medium transition-colors text-left">
            <span>📊</span>{sidebarAberta && <span>Rubricas</span>}
          </button>
          <button onClick={() => router.push("/adiantamento")} className="w-full flex items-center gap-4 px-4 py-3 text-emerald-400 bg-emerald-400/5 hover:bg-emerald-400/20 rounded-r-full font-medium transition-colors text-left">
            <span>💵</span>{sidebarAberta && <span>Adiantamento</span>}
          </button>
          <button onClick={() => router.push("/ferias")} className="w-full flex items-center gap-4 px-4 py-3 text-emerald-400 bg-emerald-400/5 hover:bg-emerald-400/20 rounded-r-full font-medium transition-colors text-left">
            <span>🏖️</span>{sidebarAberta && <span>Férias</span>}
          </button>
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL DO SISTEMA */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50">
        
        {/* CORPO DO PAINEL */}
        <div className="p-6 md:p-12 flex-1 z-10 overflow-y-auto">
          <div className="max-w-6xl mx-auto relative">
            
            {/* BANNER PRINCIPAL - COM ESPAÇAMENTO INFERIOR (mb-32) */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden mb-32">
              <div className="md:w-3/5 text-left relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full mb-4 uppercase tracking-wider border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Ambiente de Operação Ativo
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 leading-tight">Auditoria da Folha de Pagamento Inteligente e Automatizada</h2>
                <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-2xl">Módulos analíticos integrados para processamento de conciliações em lote. Selecione o escopo operacional abaixo ou gerencie as rotinas ativas pelo painel de navegação lateral.</p>
              </div>
              <div className="md:w-2/5 flex justify-center md:justify-end relative z-10">
                <img src="/ciborgue.png" alt="Assistente Virtual" className="w-48 md:w-64 object-contain drop-shadow-md"/>
              </div>
            </div>
            
            {/* SEÇÃO 1: MÓDULOS DE INTELIGÊNCIA */}
            <div>
              {/* TÍTULO COM ESPAÇAMENTO INFERIOR REDUZIDO (mb-8) */}
              <div className="flex items-center justify-start gap-3 mb-8">
                <span className="text-emerald-500 text-2xl font-bold">⋙</span>
                <h3 className="text-xl font-extrabold text-emerald-600 tracking-wider uppercase text-left">MÓDULOS DE INTELIGÊNCIA</h3>
              </div>

              {/* GRID COM OS CARDS PINTADOS DE AZUL ESCURO (#1e212b) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 xl:gap-10 text-left">
                
                {/* CARD 1: RUBRICAS */}
                <div onClick={() => router.push("/rubricas")} className="bg-[#1e212b] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all duration-300 flex flex-col justify-between cursor-pointer group min-h-[340px]">
                  <div>
                    <div className="flex items-center gap-4 mb-4 pb-3 border-b border-slate-700/50">
                      <div className="relative p-3 bg-emerald-500/10 rounded-xl text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-transparent opacity-30 blur-md rounded-full pointer-events-none"></div>
                        <FileSpreadsheet className="w-6 h-6 relative z-10" />
                      </div>
                      <h4 className="text-white font-bold text-lg xl:text-xl leading-snug">Auditoria de Rubricas</h4>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">Motor de cruzamento de dados em alta velocidade. Valida planilhas horizontais de lançamentos contra extratos KMM, identificando divergências centesimais com precisão absoluta.</p>
                  </div>
                  <div className="text-emerald-400 text-xs font-bold mt-6 pt-3 border-t border-slate-700/50 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Acessar Módulo ➔
                  </div>
                </div>

                {/* CARD 2: ADIANTAMENTO */}
                <div onClick={() => router.push("/adiantamento")} className="bg-[#1e212b] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all duration-300 flex flex-col justify-between cursor-pointer group min-h-[340px]">
                  <div>
                    <div className="flex items-center gap-4 mb-4 pb-3 border-b border-slate-700/50">
                      <div className="relative p-3 bg-emerald-500/10 rounded-xl text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-transparent opacity-30 blur-md rounded-full pointer-events-none"></div>
                        <Banknote className="w-6 h-6 relative z-10" />
                      </div>
                      <h4 className="text-white font-bold text-lg xl:text-xl leading-snug">Adiantamento Salarial</h4>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">Análise preditiva de pagamentos. Cruza admitidos, demitidos e férias para garantir a proporcionalidade exata dos adiantamentos (evento 100), com geração de relatórios e painéis gráficos.</p>
                  </div>
                  <div className="text-emerald-400 text-xs font-bold mt-6 pt-3 border-t border-slate-700/50 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Acessar Módulo ➔
                  </div>
                </div>

                {/* CARD 3: FÉRIAS */}
                <div onClick={() => router.push("/ferias")} className="bg-[#1e212b] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all duration-300 flex flex-col justify-between cursor-pointer group min-h-[340px]">
                  <div>
                    <div className="flex items-center gap-4 mb-4 pb-3 border-b border-slate-700/50">
                      <div className="relative p-3 bg-emerald-500/10 rounded-xl text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-transparent opacity-30 blur-md rounded-full pointer-events-none"></div>
                        <CalendarDays className="w-6 h-6 relative z-10" />
                      </div>
                      <h4 className="text-white font-bold text-lg xl:text-xl leading-snug">Conferência de Férias</h4>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">Leitura nativa de PDF. Extrai dados contratuais e reconstrói o cálculo de médias de variáveis e abono pecuniário, aplicando reajustes salariais históricos de forma automática.</p>
                  </div>
                  <div className="text-emerald-400 text-xs font-bold mt-6 pt-3 border-t border-slate-700/50 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Acessar Módulo ➔
                  </div>
                </div>

              </div>
            </div>

            {/* SEÇÃO 2: SUPORTE / COMERCIAL B2B COM ESPAÇAMENTO SUPERIOR AUMENTADO (mt-32) */}
            <div className="mt-32 pt-16 border-t border-slate-200">
              
              {/* TÍTULO COM ESPAÇAMENTO INFERIOR REDUZIDO (mb-8) */}
              <div className="flex items-center justify-start gap-3 mb-8">
                <span className="text-slate-400 text-xl font-bold">⋙</span>
                <h3 className="text-lg font-extrabold text-slate-700 tracking-wider uppercase text-left">Suporte e Integrações</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                
                {/* BLOCO DA ESQUERDA: COMERCIAL */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="text-slate-800 font-bold text-base mb-2 flex items-center gap-2">
                      <span className="text-xl">🛠️</span> 
                      Demandas sob Medida & Automações
                    </h4>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Sua empresa opera com regras específicas ou necessita de integração com outras plataformas? Desenvolvemos rotinas exclusivas para o seu fluxo de Departamento Pessoal.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Módulos Disponíveis para Integração</span>
                    <p className="text-slate-600 text-xs font-semibold">• Parametrização e conciliação de outros sistemas de DP</p>
                    <p className="text-slate-600 text-xs font-semibold">• Customização de relatórios de auditoria e BI</p>
                  </div>
                  <a 
                    href="mailto:comercial@bwisecontabilidade.com?subject=Solicitação de Orçamento - Novos Módulos de DP"
                    className="w-full text-center py-2.5 bg-[#1e212b] hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors tracking-wide uppercase shadow-sm"
                  >
                    Solicitar Orçamento de Novos Módulos
                  </a>
                </div>

                {/* BLOCO DA DIREITA: SUPORTE */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="text-slate-800 font-bold text-base mb-2 flex items-center gap-2">
                      <span className="text-xl">📞</span> 
                      Suporte Operacional da Plataforma
                    </h4>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Instabilidades no motor de processamento, dúvidas de parametrização ou erros de upload em lote devem ser reportados diretamente ao time técnico.
                    </p>
                  </div>
                  
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-start gap-2.5 text-xs text-slate-600">
                      <span className="text-slate-400 font-bold mt-0.5">✉️</span>
                      <div>
                        <span className="font-bold text-slate-700 block">Canal de Atendimento:</span>
                        <a href="mailto:suporte@bwisecontabilidade.com" className="text-emerald-600 font-medium hover:underline">suporte@bwisecontabilidade.com</a>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-slate-600 border-t border-slate-200/60 pt-2.5">
                      <span className="text-slate-400 font-bold mt-0.5">🏢</span>
                      <div>
                        <span className="font-bold text-slate-700 block">Unidade Corporativa Bwise:</span>
                        <p className="text-slate-500 font-medium">Curitiba / PR — Atendimento focado em compliance trabalhista.</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>

    </div>
  );
}