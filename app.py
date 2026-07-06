"""
app.py
──────
Ponto de entrada principal do backend FastAPI (Motor Bwise).
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

# Importações dos serviços de auditoria
from services.comparador import executar_comparacao, gerar_excel
from services.adiantamento import executar_conferencia_adiantamento, gerar_excel_adiantamento
from services.ferias import processar_auditoria_ferias
from services.consignados import executar_conferencia_consignados, gerar_excel_consignados

app = FastAPI(title="Motor Bwise")

# Permite que o nosso front-end (localhost:3000) se comunique livremente com a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
        
        planilha_bytes = gerar_excel(resultados)
        
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
        
        planilha_bytes = gerar_excel_adiantamento(resultados, meta)
        
        return Response(
            content=planilha_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=Conferencia_Adiantamento_Mes_{meta['mes_atu']}.xlsx"}
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
        planilha_bytes = gerar_excel_consignados(resultados, meta)

        return Response(
            content=planilha_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=Conferencia_Consignados.xlsx"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
