"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../../lib/api";

export default function RubricasPage() {
  const router = useRouter();
  const [arqLancamentos, setArqLancamentos] = useState<File | null>(null);
  const [arqSistema, setArqSistema] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);

  const handleAuditarRubricas = async () => {
    if (!arqLancamentos || !arqSistema) return;
    setCarregando(true);

    const formData = new FormData();
    formData.append("arquivo_lanc", arqLancamentos);
    formData.append("arquivo_sist", arqSistema);

    try {
      const resposta = await fetch(`${API_BASE_URL}/api/auditoria-rubricas`, {
        method: "POST",
        body: formData,
      });

      if (!resposta.ok) throw new Error("Erro ao processar auditoria de rúbricas.");

      const blob = await resposta.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Conferencia_Rubricas.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (erro: any) {
      alert(erro.message || "Erro ao conectar com o motor.");
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
          <h2 className="text-4xl font-extrabold text-bwise-texto tracking-tight">Auditoria de Rubricas</h2>
          <p className="text-bwise-texto-sec mt-2 text-lg">Faça o upload dos dois arquivos necessários para realizar os cruzamentos automatizados.</p>
        </div>

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
      </div>
    </main>
  );
}