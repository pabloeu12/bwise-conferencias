"use client";

import { useRouter } from "next/navigation";
import { FileSpreadsheet, Banknote, CalendarDays, CreditCard } from "lucide-react";
import Topbar from "./components/Topbar";

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex-1 flex flex-col relative overflow-hidden">
      <Topbar />
      <div className="p-6 md:p-12 flex-1 z-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto relative">

          {/* BANNER PRINCIPAL */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-bwise-superficie p-8 rounded-3xl border border-bwise-borda shadow-sm relative overflow-hidden mb-32">
            <div className="md:w-3/5 text-left relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-bwise-verde-claro text-bwise-verde-escuro text-xs font-bold rounded-full mb-4 uppercase tracking-wider border border-bwise-verde/30">
                <span className="w-2 h-2 rounded-full bg-bwise-verde animate-pulse"></span> Ambiente de Operação Ativo
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-bwise-texto mb-4 leading-tight">Auditoria da Folha de Pagamento Inteligente e Automatizada</h2>
              <p className="text-bwise-texto-sec text-sm md:text-base leading-relaxed max-w-2xl">Módulos analíticos integrados para processamento de conciliações em lote. Selecione o escopo operacional abaixo ou gerencie as rotinas ativas pelo painel de navegação lateral.</p>
            </div>
            <div className="md:w-2/5 flex justify-center md:justify-end relative z-10">
              <img src="/ciborgue.png" alt="Assistente Virtual" className="w-48 md:w-64 object-contain drop-shadow-md" />
            </div>
          </div>

          {/* SEÇÃO 1: MÓDULOS DE INTELIGÊNCIA */}
          <div>
            <div className="flex items-center justify-start gap-3 mb-8">
              <span className="text-bwise-verde text-2xl font-bold">⋙</span>
              <h3 className="text-xl font-extrabold text-bwise-verde-escuro tracking-wider uppercase text-left">MÓDULOS DE INTELIGÊNCIA</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 xl:gap-6 text-left">

              {/* CARD 1: RUBRICAS */}
              <div onClick={() => router.push("/rubricas")} className="bg-bwise-grafite rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all duration-300 flex flex-col justify-between cursor-pointer group min-h-[340px]">
                <div>
                  <div className="flex items-center gap-4 mb-4 pb-3 border-b border-bwise-grafite-claro/50">
                    <div className="relative p-3 bg-bwise-verde/10 rounded-xl text-bwise-verde flex items-center justify-center border border-bwise-verde/20 shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-bwise-verde to-transparent opacity-30 blur-md rounded-full pointer-events-none"></div>
                      <FileSpreadsheet className="w-6 h-6 relative z-10" />
                    </div>
                    <h4 className="text-white font-bold text-lg leading-snug">Auditoria de Rubricas</h4>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">Motor de cruzamento de dados em alta velocidade. Valida planilhas horizontais de lançamentos contra extratos KMM, identificando divergências centesimais com precisão absoluta.</p>
                </div>
                <div className="text-bwise-verde text-xs font-bold mt-6 pt-3 border-t border-bwise-grafite-claro/50 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Acessar Módulo ➔
                </div>
              </div>

              {/* CARD 2: ADIANTAMENTO */}
              <div onClick={() => router.push("/adiantamento")} className="bg-bwise-grafite rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all duration-300 flex flex-col justify-between cursor-pointer group min-h-[340px]">
                <div>
                  <div className="flex items-center gap-4 mb-4 pb-3 border-b border-bwise-grafite-claro/50">
                    <div className="relative p-3 bg-bwise-verde/10 rounded-xl text-bwise-verde flex items-center justify-center border border-bwise-verde/20 shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-bwise-verde to-transparent opacity-30 blur-md rounded-full pointer-events-none"></div>
                      <Banknote className="w-6 h-6 relative z-10" />
                    </div>
                    <h4 className="text-white font-bold text-lg leading-snug">Adiantamento Salarial</h4>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">Cruza admitidos, demitidos e férias para garantir a proporcionalidade exata dos adiantamentos (evento 100), gerando um relatório de conferência em Excel.</p>
                </div>
                <div className="text-bwise-verde text-xs font-bold mt-6 pt-3 border-t border-bwise-grafite-claro/50 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Acessar Módulo ➔
                </div>
              </div>

              {/* CARD 3: FÉRIAS */}
              <div onClick={() => router.push("/ferias")} className="bg-bwise-grafite rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all duration-300 flex flex-col justify-between cursor-pointer group min-h-[340px]">
                <div>
                  <div className="flex items-center gap-4 mb-4 pb-3 border-b border-bwise-grafite-claro/50">
                    <div className="relative p-3 bg-bwise-verde/10 rounded-xl text-bwise-verde flex items-center justify-center border border-bwise-verde/20 shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-bwise-verde to-transparent opacity-30 blur-md rounded-full pointer-events-none"></div>
                      <CalendarDays className="w-6 h-6 relative z-10" />
                    </div>
                    <h4 className="text-white font-bold text-lg leading-snug">Conferência de Férias</h4>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">Leitura nativa de PDF. Extrai dados contratuais e reconstrói o cálculo de médias de variáveis e abono pecuniário, aplicando reajustes salariais históricos de forma automática.</p>
                </div>
                <div className="text-bwise-verde text-xs font-bold mt-6 pt-3 border-t border-bwise-grafite-claro/50 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Acessar Módulo ➔
                </div>
              </div>

              {/* CARD 4: CONSIGNADOS */}
              <div onClick={() => router.push("/consignados")} className="bg-bwise-grafite rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all duration-300 flex flex-col justify-between cursor-pointer group min-h-[340px]">
                <div>
                  <div className="flex items-center gap-4 mb-4 pb-3 border-b border-bwise-grafite-claro/50">
                    <div className="relative p-3 bg-bwise-verde/10 rounded-xl text-bwise-verde flex items-center justify-center border border-bwise-verde/20 shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-bwise-verde to-transparent opacity-30 blur-md rounded-full pointer-events-none"></div>
                      <CreditCard className="w-6 h-6 relative z-10" />
                    </div>
                    <h4 className="text-white font-bold text-lg leading-snug">Conferência de Consignados</h4>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">Cruza Emprega Brasil, recibo de pagamento e lista de eventos para validar descontos de empréstimos consignados e o limite de 35% da margem, evento a evento.</p>
                </div>
                <div className="text-bwise-verde text-xs font-bold mt-6 pt-3 border-t border-bwise-grafite-claro/50 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Acessar Módulo ➔
                </div>
              </div>

            </div>
          </div>

          {/* SEÇÃO 2: SUPORTE / COMERCIAL B2B */}
          <div className="mt-32 pt-16 border-t border-bwise-borda">
            <div className="flex items-center justify-start gap-3 mb-8">
              <span className="text-bwise-texto-sec text-xl font-bold">⋙</span>
              <h3 className="text-lg font-extrabold text-bwise-texto tracking-wider uppercase text-left">Suporte e Integrações</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">

              {/* BLOCO DA ESQUERDA: COMERCIAL */}
              <div className="bg-bwise-superficie border border-bwise-borda p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-bwise-texto font-bold text-base mb-2 flex items-center gap-2">
                    <span className="text-xl">🛠️</span>
                    Demandas sob Medida & Automações
                  </h4>
                  <p className="text-bwise-texto-sec text-xs leading-relaxed">
                    Sua empresa opera com regras específicas ou necessita de integração com outras plataformas? Desenvolvemos rotinas exclusivas para o seu fluxo de Departamento Pessoal.
                  </p>
                </div>
                <div className="bg-bwise-fundo p-4 rounded-xl border border-bwise-borda">
                  <span className="text-[11px] font-bold text-bwise-texto-sec uppercase tracking-wider block mb-1">Módulos Disponíveis para Integração</span>
                  <p className="text-bwise-texto-sec text-xs font-semibold">• Parametrização e conciliação de outros sistemas de DP</p>
                  <p className="text-bwise-texto-sec text-xs font-semibold">• Customização de relatórios de auditoria e BI</p>
                </div>
                <a
                  href="mailto:comercial@bwisecontabilidade.com?subject=Solicitação de Orçamento - Novos Módulos de DP"
                  className="w-full text-center py-2.5 bg-bwise-grafite hover:bg-bwise-grafite-hover text-white font-bold text-xs rounded-xl transition-colors tracking-wide uppercase shadow-sm"
                >
                  Solicitar Orçamento de Novos Módulos
                </a>
              </div>

              {/* BLOCO DA DIREITA: SUPORTE */}
              <div className="bg-bwise-superficie border border-bwise-borda p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-bwise-texto font-bold text-base mb-2 flex items-center gap-2">
                    <span className="text-xl">📞</span>
                    Suporte Operacional da Plataforma
                  </h4>
                  <p className="text-bwise-texto-sec text-xs leading-relaxed">
                    Instabilidades no motor de processamento, dúvidas de parametrização ou erros de upload em lote devem ser reportados diretamente ao time técnico.
                  </p>
                </div>

                <div className="space-y-3 bg-bwise-fundo p-4 rounded-xl border border-bwise-borda">
                  <div className="flex items-start gap-2.5 text-xs text-bwise-texto-sec">
                    <span className="text-bwise-texto-sec font-bold mt-0.5">✉️</span>
                    <div>
                      <span className="font-bold text-bwise-texto block">Canal de Atendimento:</span>
                      <a href="mailto:suporte@bwisecontabilidade.com" className="text-bwise-verde-escuro font-medium hover:underline">suporte@bwisecontabilidade.com</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-bwise-texto-sec border-t border-bwise-borda pt-2.5">
                    <span className="text-bwise-texto-sec font-bold mt-0.5">🏢</span>
                    <div>
                      <span className="font-bold text-bwise-texto block">Unidade Corporativa Bwise:</span>
                      <p className="text-bwise-texto-sec font-medium">Curitiba / PR — Atendimento focado em compliance trabalhista.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
