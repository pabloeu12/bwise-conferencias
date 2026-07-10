"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../../lib/api";
import PassoAPasso from "../components/PassoAPasso";
import Topbar from "../components/Topbar";

export default function ConsignadosPage() {
  const router = useRouter();
  const [arqEmprega, setArqEmprega] = useState<File | null>(null);
  const [arqRecibos, setArqRecibos] = useState<File | null>(null);
  const [arqEventos, setArqEventos] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);

  const handleAuditarConsignados = async () => {
    if (!arqEmprega || !arqRecibos || !arqEventos) return;
    setCarregando(true);

    const formData = new FormData();
    formData.append("arquivo_emprega", arqEmprega);
    formData.append("arquivo_recibos", arqRecibos);
    formData.append("arquivo_eventos", arqEventos);

    try {
      const resposta = await fetch(`${API_BASE_URL}/api/auditoria-consignados`, {
        method: "POST",
        body: formData,
      });

      if (!resposta.ok) throw new Error("Erro ao processar a conferência de consignados.");

      const blob = await resposta.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Conferencia_Consignados.xlsx";
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
    <main className="flex-1 flex flex-col overflow-y-auto">
      <Topbar />
      <div className="max-w-5xl mx-auto w-full flex flex-col p-12">
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
      </div>
    </main>
  );
}
