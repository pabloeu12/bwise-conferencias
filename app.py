"""
app.py
──────
Ponto de entrada principal do backend FastAPI (Motor Bwise).
"""

import os
from typing import Any

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

# Importações dos serviços de auditoria
from services.comparador import executar_comparacao, gerar_excel
from services.adiantamento import executar_conferencia_adiantamento, gerar_excel_adiantamento
from services.ferias import processar_auditoria_ferias
from services.consignados import executar_conferencia_consignados, gerar_excel_consignados

app = FastAPI(title="Motor Bwise")

# Origens do front-end autorizadas a chamar a API. Em produção, defina a
# variável de ambiente FRONTEND_ORIGINS (separada por vírgula) com a URL
# pública do frontend (ex: https://seu-app.vercel.app). Em desenvolvimento
# local, localhost:3000 já funciona sem configuração extra.
_origens_padrao = "http://localhost:3000"
origens = [
    origem.strip()
    for origem in os.environ.get("FRONTEND_ORIGINS", _origens_padrao).split(",")
    if origem.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origens,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def arquivo_nomeado(upload: UploadFile):
    """Preserva o nome original para os leitores CSV/XLS/XLSX dos serviços."""
    upload.file.seek(0)
    setattr(upload.file, "filename", upload.filename)
    return upload.file

@app.get("/")
def home():
    return {"status": "Motor Bwise operando 100%!"}

# ════════════════════════════════════════════════════════════
# Modelos de requisição para geração de Excel a partir de dados
# já calculados (permite exportar exatamente o que está filtrado
# na tela, sem reprocessar os arquivos originais).
# ════════════════════════════════════════════════════════════
class ExcelRubricasRequest(BaseModel):
    resultados: list[dict[str, Any]]

class ExcelComMetaRequest(BaseModel):
    resultados: list[dict[str, Any]]
    meta: dict[str, Any]

# ════════════════════════════════════════════════════════════
# ROTA: AUDITORIA DE RÚBRICAS (FOLHA MENSAL)
# ════════════════════════════════════════════════════════════
@app.post("/api/auditoria-rubricas")
async def api_auditoria_rubricas(
    arquivo_lanc: UploadFile = File(...),
    arquivo_sist: UploadFile = File(...)
):
    try:
        resultados = executar_comparacao(arquivo_nomeado(arquivo_lanc), arquivo_nomeado(arquivo_sist))
        if not resultados:
            raise HTTPException(status_code=400, detail="Nenhuma divergência ou dado foi processado.")
        return {"resultados": resultados}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auditoria-rubricas/excel")
async def api_auditoria_rubricas_excel(payload: ExcelRubricasRequest):
    try:
        planilha_bytes = gerar_excel(payload.resultados)
        return Response(
            content=planilha_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=Conferencia_Rubricas.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ════════════════════════════════════════════════════════════
# ROTA: AUDITORIA DE ADIANTAMENTO SALARIAL
# ════════════════════════════════════════════════════════════
@app.post("/api/auditoria-adiantamento")
async def api_auditoria_adiantamento(
    arquivo_eventos: UploadFile = File(...),
    arquivo_ativos: UploadFile = File(...),
    arquivo_ferias: UploadFile = File(...)
):
    try:
        resultados, meta = executar_conferencia_adiantamento(
            arquivo_nomeado(arquivo_eventos),
            arquivo_nomeado(arquivo_ativos),
            arquivo_nomeado(arquivo_ferias),
        )
        return {"resultados": resultados, "meta": meta}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auditoria-adiantamento/excel")
async def api_auditoria_adiantamento_excel(payload: ExcelComMetaRequest):
    try:
        # Igual ao comportamento original: o resumo do Excel reflete o
        # conjunto (possivelmente filtrado na tela) que está sendo exportado,
        # não os totais originais da conferência completa.
        resultados = payload.resultados
        mes_ant = payload.meta.get("mes_ant")
        mes_atu = payload.meta.get("mes_atu")
        isentos = ["Funcionário Novo", "Sem adiantamento (opcional)", "Não tem direito (admitido após dia 6)"]

        meta_recalculada = {
            "mes_ant": mes_ant,
            "mes_atu": mes_atu,
            "tot_ant": float(sum(r.get("Adiantamento Mês Anterior") or 0 for r in resultados)),
            "tot_atu": float(sum(r.get("Adiantamento Mês Atual") or 0 for r in resultados)),
            "total_ativos": len(resultados),
            "total_corretos": sum(1 for r in resultados if "Certo" in str(r.get("Status", ""))),
            "total_errados": sum(1 for r in resultados if r.get("Status") == "Errado"),
            "total_isentos": sum(1 for r in resultados if r.get("Status") in isentos),
        }

        planilha_bytes = gerar_excel_adiantamento(resultados, meta_recalculada)
        return Response(
            content=planilha_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=Conferencia_Adiantamento_Mes_{mes_atu}.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ════════════════════════════════════════════════════════════
# ROTA: CONFERÊNCIA DE RECIBO DE FÉRIAS
# ════════════════════════════════════════════════════════════
@app.post("/api/auditoria-ferias")
async def api_auditoria_ferias(
    pdf_ferias: UploadFile = File(...),
    arquivo_eventos: UploadFile = File(...),
    arquivo_historico: UploadFile = File(...)
):
    try:
        resultado = processar_auditoria_ferias(
            arquivo_nomeado(pdf_ferias),
            arquivo_nomeado(arquivo_eventos),
            arquivo_nomeado(arquivo_historico),
        )
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ════════════════════════════════════════════════════════════
# ROTA: CONFERÊNCIA DE EMPRÉSTIMOS CONSIGNADOS
# ════════════════════════════════════════════════════════════
@app.post("/api/auditoria-consignados")
async def api_auditoria_consignados(
    arquivo_emprega: UploadFile = File(...),
    arquivo_recibos: UploadFile = File(...),
    arquivo_eventos: UploadFile = File(...),
):
    try:
        resultados, meta = executar_conferencia_consignados(
            arquivo_nomeado(arquivo_emprega),
            arquivo_nomeado(arquivo_recibos),
            arquivo_nomeado(arquivo_eventos),
        )
        return {"resultados": resultados, "meta": meta}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auditoria-consignados/excel")
async def api_auditoria_consignados_excel(payload: ExcelComMetaRequest):
    try:
        planilha_bytes = gerar_excel_consignados(payload.resultados, payload.meta)
        return Response(
            content=planilha_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=Conferencia_Consignados.xlsx"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
