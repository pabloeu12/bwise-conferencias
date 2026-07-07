"""
app.py
──────
Ponto de entrada principal do backend FastAPI (Motor Bwise).
Centraliza as APIs das 4 auditorias garantindo estabilidade máxima.
"""

import sys
import os
import json
from io import BytesIO
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.encoders import jsonable_encoder

# Garante que a pasta atual e a pasta 'services' estejam no caminho de busca do Python
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# =====================================================================
# IMPORTAÇÕES DOS SERVIÇOS DE AUDITORIA (BLINDAGEM DE IMPORTAÇÃO)
# =====================================================================

# 1. Módulo de Rúbricas / Comparador
ejecutar_comparacao = None
gerar_excel = None
try:
    from services.comparador import ejecutar_comparacao, gerar_excel
except Exception:
    try:
        from services.comparador import executar_comparacao, gerar_excel
        ejecutar_comparacao = executar_comparacao
    except Exception:
        try:
            from services.rubricas import executar_comparacao, gerar_excel
            ejecutar_comparacao = executar_comparacao
        except Exception:
            print("[AVISO] Não foi possível carregar o módulo de Rúbricas.")

# 2. Módulo de Adiantamento
executar_conferencia_adiantamento = None
gerar_excel_adiantamento = None
try:
    from services.adiantamento import executar_conferencia_adiantamento, gerar_excel_adiantamento
except Exception:
    print("[AVISO] Não foi possível carregar o módulo de Adiantamento.")

# 3. Módulo de Férias
processar_auditoria_ferias = None
try:
    from services.ferias import processar_auditoria_ferias
except Exception:
    print("[AVISO] Não foi possível carregar o módulo de Férias.")

# 4. Módulo de Consignados
executar_conferencia_consignado = None
gerar_excel_consignado = None
try:
    from services.consignado import executar_conferencia_consignado, gerar_excel_consignado
except Exception:
    print("[AVISO] Não foi possível carregar o módulo de Consignados.")


app = FastAPI(title="Motor de Auditoria Bwise", version="1.7.0")

# =====================================================================
# CONFIGURAÇÃO DE SEGURANÇA (CORS) - LIBERAÇÃO TOTAL
# =====================================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def check_status():
    """Rota de teste básico para verificar se o motor está ligado."""
    return {
        "status": "Motor Bwise operando 100%!",
        "modulos_carregados": {
            "rubricas": ejecutar_comparacao is not None,
            "adiantamento": executar_conferencia_adiantamento is not None,
            "ferias": processar_auditoria_ferias is not None,
            "consignados": executar_conferencia_consignado is not None
        }
    }

# ════════════════════════════════════════════════════════════
# ROTA 1: AUDITORIA DE RÚBRICAS (FOLHA MENSAL) - CORRIGIDA
# ════════════════════════════════════════════════════════════
@app.post("/api/auditoria-rubricas")
async def api_auditoria_rubricas(
    arquivo_lanc: UploadFile = File(...),
    arquivo_sist: UploadFile = File(...)
):
    if not ejecutar_comparacao or not gerar_excel:
        raise HTTPException(status_code=501, detail="Serviço de Rúbricas não carregado no servidor.")
    try:
        # Executa a lógica nativa do comparador.py
        resultados = ejecutar_comparacao(arquivo_lanc.file, arquivo_sist.file)
        
        # Gera o buffer binário do Excel nativo esperado pelo Front-end
        planilha_bytes = gerar_excel(resultados)
        
        if not planilha_bytes:
            raise HTTPException(status_code=400, detail="Erro ao gerar arquivo Excel de Rúbricas.")
            
        return StreamingResponse(
            BytesIO(planilha_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=Conferencia_Rubricas.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno no processamento de Rúbricas: {str(e)}")

# ════════════════════════════════════════════════════════════
# ROTA 2: AUDITORIA DE ADIANTAMENTO SALARIAL
# ════════════════════════════════════════════════════════════
@app.post("/api/auditoria-adiantamento")
async def api_auditoria_adiantamento(
    arquivo_eventos: UploadFile = File(...),
    arquivo_ativos: UploadFile = File(...),
    arquivo_ferias: UploadFile = File(...)
):
    if not executar_conferencia_adiantamento:
        raise HTTPException(status_code=501, detail="Serviço de Adiantamento não carregado no servidor.")
    try:
        resultados, meta = executar_conferencia_adiantamento(
            arquivo_eventos.file, 
            arquivo_ativos.file, 
            arquivo_ferias.file
        )
        planilha_bytes = gerar_excel_adiantamento(resultados, meta)
        nome_mes = meta.get("mes_atu", "Geral")
        
        return StreamingResponse(
            BytesIO(planilha_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=Conferencia_Adiantamento_Mes_{nome_mes}.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno no Adiantamento: {str(e)}")

# ════════════════════════════════════════════════════════════
# ROTA 3: CONFERÊNCIA DE RECIBO DE FÉRIAS
# ════════════════════════════════════════════════════════════
@app.post("/api/auditoria-ferias")
async def api_auditoria_ferias(
    pdf_ferias: UploadFile = File(...),
    arquivo_eventos: UploadFile = File(...),
    arquivo_historico: UploadFile = File(...)
):
    if not processar_auditoria_ferias:
        raise HTTPException(status_code=501, detail="Serviço de Férias não carregado no servidor.")
    try:
        resultado = processar_auditoria_ferias(
            pdf_ferias.file,
            arquivo_eventos.file,
            arquivo_historico.file
        )
        
        if isinstance(resultado, str):
            try:
                resultado_dados = json.loads(resultado)
            except Exception:
                resultado_dados = resultado
        else:
            resultado_dados = resultado

        return JSONResponse(content=jsonable_encoder(resultado_dados))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno nas Férias: {str(e)}")

# ════════════════════════════════════════════════════════════
# ROTA 4: AUDITORIA DE EMPRÉSTIMOS CONSIGNADOS
# ════════════════════════════════════════════════════════════
@app.post("/api/auditoria-consignados")
async def api_auditoria_consignados(
    arquivo_emprega: UploadFile = File(...),
    arquivo_recibos: UploadFile = File(...),
    arquivo_eventos: UploadFile = File(...)
):
    if not executar_conferencia_consignado:
        raise HTTPException(status_code=501, detail="Serviço de Consignados não carregado no servidor.")
    try:
        resultados, meta = executar_conferencia_consignado(
            arquivo_emprega.file, 
            arquivo_recibos.file, 
            arquivo_eventos.file
        )
        planilha_bytes = gerar_excel_consignado(resultados, meta)
        return StreamingResponse(
            BytesIO(planilha_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=Conferencia_Consignados.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno nos Consignados: {str(e)}")