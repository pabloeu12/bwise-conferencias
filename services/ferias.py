"""
services/ferias.py
──────────────────
Processador nativo de PDF (pdfplumber) e cálculo de médias históricas de férias.
"""

import re
import pdfplumber
import pandas as pd
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

from core.utils import moeda_para_float

EVENTOS_MEDIAS = [158, 115, 161, 117, 120, 619, 575, 642, 644, 645, 643, 153, 465, 700, 699, 460]

def arredondar(valor):
    try:
        return float(Decimal(str(valor)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
    except:
        return valor

def nome_arquivo(arquivo) -> str:
    # SpooledTemporaryFile (usado pelo upload do FastAPI) tem atributo "name" que
    # existe mas vale None enquanto o arquivo não é rolado para disco — por isso
    # "filename" (nome original explícito) precisa ser checado primeiro.
    nome = getattr(arquivo, "filename", None) or getattr(arquivo, "name", None) or ""
    return str(nome).lower()

def reposicionar(arquivo):
    try:
        arquivo.seek(0)
    except Exception:
        pass

def ler_tabela(arquivo, **kwargs) -> pd.DataFrame:
    reposicionar(arquivo)
    nome = nome_arquivo(arquivo)
    if nome.endswith(".csv"):
        return pd.read_csv(arquivo, sep=None, engine="python", **kwargs)
    if nome.endswith(".xls"):
        return pd.read_excel(arquivo, engine="xlrd", **kwargs)
    return pd.read_excel(arquivo, engine="openpyxl", **kwargs)

def obter_salario_epoca(df_hist, mes_evt, ano_evt):
    if df_hist is None or df_hist.empty: return None
    df_temp = df_hist.copy()
    df_temp['Data de reajuste'] = pd.to_datetime(df_temp['Data de reajuste'], errors='coerce', dayfirst=True)
    df_temp = df_temp.dropna(subset=['Data de reajuste']).sort_values(by='Data de reajuste', ascending=True)
    
    if df_temp.empty: return None
    salario_vigente = float(df_temp.iloc[0]['Salário'])
    
    for _, row in df_temp.iterrows():
        data_reajuste = row['Data de reajuste']
        if (ano_evt > data_reajuste.year) or (ano_evt == data_reajuste.year and mes_evt >= data_reajuste.month):
            salario_vigente = float(row['Salário novo'])
        else:
            break
    return salario_vigente

def extrair_dados_pdf(pdf_file) -> dict:
    dados = {'eventos': {}}
    with pdfplumber.open(pdf_file) as pdf:
        texto = "".join([(page.extract_text() or "") + "\n" for page in pdf.pages])
        
    match_salario = re.search(r'Salário Contratual:[\s]*([\d\.,]+)', texto)
    if match_salario: dados['salario'] = float(match_salario.group(1).replace('.', '').replace(',', '.'))
        
    match_periodo = re.search(r'Período Aquisitivo:[\s]*([\d]{2}/[\d]{2}/[\d]{4})\s*a\s*([\d]{2}/[\d]{2}/[\d]{4})', texto)
    if match_periodo:
        dados['periodo_str'] = f"{match_periodo.group(1)} a {match_periodo.group(2)}"
        dados['inicio_aquisitivo'] = datetime.strptime(match_periodo.group(1), '%d/%m/%Y')
        dados['fim_aquisitivo'] = datetime.strptime(match_periodo.group(2), '%d/%m/%Y')
        
    match_mat = re.search(r'Matrícula:[\s]*(\d+)', texto)
    if match_mat: dados['matricula'] = int(match_mat.group(1))

    for linha in texto.split('\n'):
        match_evento = re.search(r'^(\d{4})\s*-\s*(.*?)\s+([\d\.,]+)\s+([\d\.,]+)', linha)
        if match_evento:
            cod = int(match_evento.group(1))
            ref = float(match_evento.group(3).replace(',', '.'))
            provento = float(match_evento.group(4).replace('.', '').replace(',', '.'))
            dados['eventos'][cod] = {'referencia': ref, 'provento': provento}
            
    return dados

def carregar_historico(historico_file, matricula):
    df_hist = ler_tabela(historico_file)
    df_hist.columns = df_hist.columns.str.strip()
    df_hist = df_hist[df_hist['Matrícula'] == matricula]
    return df_hist[['Data de reajuste', 'Salário', 'Salário novo']].dropna()

def carregar_eventos(eventos_file, matricula):
    df_evt = ler_tabela(eventos_file, skiprows=1)
    df_evt.columns = df_evt.columns.str.strip()
    df_evt = df_evt[df_evt['Matrícula'] == matricula]
    if 'Valor Provento' in df_evt.columns:
        df_evt['Valor Provento'] = df_evt['Valor Provento'].apply(moeda_para_float)
    return df_evt

def processar_auditoria_ferias(pdf_bytes, eventos_file, historico_file) -> dict:
    dados_pdf = extrair_dados_pdf(pdf_bytes)
    matricula = dados_pdf.get('matricula', 0)
    salario_atual = dados_pdf.get('salario', 0.0)
    
    df_hist = carregar_historico(historico_file, matricula)
    df_evt = carregar_eventos(eventos_file, matricula)

    # 1. Conferência Férias e Abono Base
    valor_dia = salario_atual / 30
    verificacoes_base = []
    
    if 189 in dados_pdf['eventos']:
        ref = dados_pdf['eventos'][189]['referencia']
        v_pdf = dados_pdf['eventos'][189]['provento']
        v_calc = arredondar(valor_dia * ref)
        verificacoes_base.append({"evento": "0189 - FÉRIAS NORMAIS", "formula": f"R$ {salario_atual:,.2f} / 30 * {ref}", "calculado": v_calc, "pdf": v_pdf, "diferenca": arredondar(v_calc - v_pdf)})
        
    if 191 in dados_pdf['eventos']:
        ref = dados_pdf['eventos'][191]['referencia']
        v_pdf = dados_pdf['eventos'][191]['provento']
        v_calc = arredondar(valor_dia * ref)
        verificacoes_base.append({"evento": "0191 - ABONO PECUNIÁRIO", "formula": f"R$ {salario_atual:,.2f} / 30 * {ref}", "calculado": v_calc, "pdf": v_pdf, "diferenca": arredondar(v_calc - v_pdf)})

    # 2. Reajuste de Variáveis de época
    total_medias_ajustadas = 0.0
    detalhes_medias = []
    
    if 'inicio_aquisitivo' in dados_pdf:
        from dateutil.relativedelta import relativedelta
        meses_calculo = []
        data_iter = dados_pdf['inicio_aquisitivo']
        for _ in range(12):
            meses_calculo.append((data_iter.month, data_iter.year))
            data_iter += relativedelta(months=1)

        for _, row in df_evt.iterrows():
            try:
                m_ev, a_ev, c_ev = int(row['Mês']), int(row['Ano']), int(row['Cód. Evento'])
            except: continue
            
            if (m_ev, a_ev) in meses_calculo and c_ev in EVENTOS_MEDIAS:
                v_orig = float(row['Valor Provento'])
                sal_epoca = obter_salario_epoca(df_hist, m_ev, a_ev)
                
                if sal_epoca and sal_epoca < salario_atual:
                    v_ajust = arredondar((v_orig / sal_epoca) * salario_atual)
                else:
                    v_ajust = arredondar(v_orig)
                    
                total_medias_ajustadas += v_ajust
                detalhes_medias.append(f"{m_ev:02d}/{a_ev} - Cód {c_ev}: R$ {v_orig:,.2f} (Base Época: R$ {sal_epoca or salario_atual:,.2f}) ➔ Corrigido p/ Salário Atual: R$ {v_ajust:,.2f}")

    media_mensal = arredondar(total_medias_ajustadas / 12)
    verificacoes_medias = []
    
    if 223 in dados_pdf['eventos']:
        ref = dados_pdf['eventos'][223]['referencia']
        v_pdf = dados_pdf['eventos'][223]['provento']
        v_calc = arredondar((media_mensal / 30) * ref)
        verificacoes_medias.append({"evento": "0223 - MÉDIAS S/ VARIÁVEIS - FÉRIAS", "formula": f"R$ {media_mensal:,.2f} / 30 * {ref}", "calculado": v_calc, "pdf": v_pdf, "diferenca": arredondar(v_calc - v_pdf)})
        
    if 224 in dados_pdf['eventos']:
        ref = dados_pdf['eventos'][224]['referencia']
        v_pdf = dados_pdf['eventos'][224]['provento']
        v_calc = arredondar((media_mensal / 30) * ref)
        verificacoes_medias.append({"evento": "0224 - MÉDIAS S/ VARIÁVEIS - ABONO", "formula": f"R$ {media_mensal:,.2f} / 30 * {ref}", "calculado": v_calc, "pdf": v_pdf, "diferenca": arredondar(v_calc - v_pdf)})

    return {
        "matricula": matricula,
        "salario_contratual": salario_atual,
        "periodo_aquisitivo": dados_pdf.get('periodo_str', 'Não Identificado'),
        "verificacoes_base": verificacoes_base,
        "detalhes_medias": detalhes_medias,
        "total_proventos_atualizados": total_medias_ajustadas,
        "media_mensal_apurada": media_mensal,
        "verificacoes_medias": verificacoes_medias
    }
