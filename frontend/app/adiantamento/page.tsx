"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdiantamentoPage() {
  const router = useRouter();
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [arqEventos, setArqEventos] = useState<File | null>(null);
  const [arqAtivos, setArqAtivos] = useState<File | null>(null);
  const [arqFerias, setArqFerias] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);

  const handleAuditarAdiantamento = async () => {
    if (!arqEventos || !arqAtivos || !arqFerias) return;
    setCarregando(true);

    const formData = new FormData();
    formData.append("arquivo_eventos", arqEventos);
    formData.append("arquivo_ativos", arqAtivos);
    formData.append("arquivo_ferias", arqFerias);

    try {
      const resposta = await fetch("http://127.0.0.1:8000/api/auditoria-adiantamento", {
        method: "POST",
        body: formData,
      });

      if (!resposta.ok) throw new Error("Erro ao processar auditoria de adiantamentos.");

      const blob = await resposta.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Conferencia_Adiantamento.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (erro: any) {
      alert(erro.message || "Erro de conexão com o motor.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* BARRA LATERAL */}
      <aside className={`${sidebarAberta ? "w-64" : "w-20"} bg-[#1e212b] flex flex-col shadow-2xl relative overflow-hidden z-20 transition-all duration-300 ease-in-out`}>
        <div className="absolute -bottom-32 -left-16 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className={`p-6 pb-4 flex ${sidebarAberta ? "justify-between" : "justify-center"} items-center border-b border-slate-700/30`}>
          {sidebarAberta && (
            <a href="https://www.bwisecontabilidade.com/" target="_blank" rel="noopener noreferrer" className="cursor-pointer transition-opacity hover:opacity-80">
              <img src="/logo.png" alt="Bwise Logo" className="w-28 object-contain" />
            </a>
          )}
          <button onClick={() => setSidebarAberta(!sidebarAberta)} className="p-2 rounded-xl bg-slate-800 text-emerald-400 hover:bg-slate-700 transition-colors">
            {sidebarAberta ? "❮" : "❯"}
          </button>
        </div>
        <nav className="flex-1 px-3 py-8 space-y-3 relative z-10">
          <button onClick={() => router.push("/")} className="w-full flex items-center gap-4 px-4 py-3 text-emerald-400 bg-emerald-400/5 hover:bg-emerald-400/20 rounded-r-full font-medium transition-colors text-left">
            <span>🏠</span>{sidebarAberta && <span>Início</span>}
          </button>
          <button onClick={() => router.push("/rubricas")} className="w-full flex items-center gap-4 px-4 py-3 text-emerald-400 bg-emerald-400/5 hover:bg-emerald-400/20 rounded-r-full font-medium transition-colors text-left">
            <span>📊</span>{sidebarAberta && <span>Rubricas</span>}
          </button>
          <button onClick={() => router.push("/adiantamento")} className="w-full flex items-center gap-4 px-4 py-3 bg-emerald-400 text-[#1e212b] rounded-r-full font-bold shadow-[0_0_15px_rgba(52,211,153,0.4)] text-left">
            <span>💵</span>{sidebarAberta && <span>Adiantamento</span>}
          </button>
          <button onClick={() => router.push("/ferias")} className="w-full flex items-center gap-4 px-4 py-3 text-emerald-400 bg-emerald-400/5 hover:bg-emerald-400/20 rounded-r-full font-medium transition-colors text-left">
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
            <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">Auditoria de Adiantamento Salarial</h2>
            <p className="text-slate-500 mt-2 text-lg">Suba as planilhas para auditar a proporcionalidade matemática exata e gerar relatórios executivos.</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex flex-col">
                <span className="font-bold text-slate-700 mb-2 block text-left">1. Arquivo de Eventos (.xlsx/.csv)</span>
                <label className={`flex flex-col items-center justify-center h-44 border-2 border-dashed rounded-xl cursor-pointer transition-all ${arqEventos ? 'bg-emerald-50/50 border-emerald-400' : 'bg-slate-50 border-slate-300 hover:bg-slate-100'}`}>
                  <div className="flex flex-col items-center p-4 text-center">
                    <span className="text-3xl mb-2">📜</span>
                    <p className="text-xs font-medium text-slate-600 break-all">{arqEventos ? arqEventos.name : "Eventos de Recibo"}</p>
                  </div>
                  <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => e.target.files && setArqEventos(e.target.files[0])} />
                </label>
              </div>

              <div className="flex flex-col">
                <span className="font-bold text-slate-700 mb-2 block text-left">2. Cadastro de Funcionários Ativos (.xlsx)</span>
                <label className={`flex flex-col items-center justify-center h-44 border-2 border-dashed rounded-xl cursor-pointer transition-all ${arqAtivos ? 'bg-emerald-50/50 border-emerald-400' : 'bg-slate-50 border-slate-300 hover:bg-slate-100'}`}>
                  <div className="flex flex-col items-center p-4 text-center">
                    <span className="text-3xl mb-2">👥</span>
                    <p className="text-xs font-medium text-slate-600 break-all">{arqAtivos ? arqAtivos.name : "Lista de Ativos"}</p>
                  </div>
                  <input type="file" className="hidden" accept=".xlsx, .xls" onChange={(e) => e.target.files && setArqAtivos(e.target.files[0])} />
                </label>
              </div>

              <div className="flex flex-col">
                <span className="font-bold text-slate-700 mb-2 block text-left">3. Relatório de Férias do Mês (.xlsx)</span>
                <label className={`flex flex-col items-center justify-center h-44 border-2 border-dashed rounded-xl cursor-pointer transition-all ${arqFerias ? 'bg-emerald-50/50 border-emerald-400' : 'bg-slate-50 border-slate-300 hover:bg-slate-100'}`}>
                  <div className="flex flex-col items-center p-4 text-center">
                    <span className="text-3xl mb-2">🏖️</span>
                    <p className="text-xs font-medium text-slate-600 break-all">{arqFerias ? arqFerias.name : "Férias Gozadas no Mês"}</p>
                  </div>
                  <input type="file" className="hidden" accept=".xlsx, .xls" onChange={(e) => e.target.files && setArqFerias(e.target.files[0])} />
                </label>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 flex justify-end">
              <button 
                onClick={handleAuditarAdiantamento}
                disabled={!arqEventos || !arqAtivos || !arqFerias || carregando}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-extrabold rounded-xl shadow-lg transition-colors"
              >
                {carregando ? "Processando..." : "Iniciar Auditoria de Adiantamento 🚀"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}