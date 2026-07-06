"""
pages/3_Ferias.py
──────────────────────
Interface Visual do Módulo de Conferência de Férias.
"""

import streamlit as st
from dateutil.relativedelta import relativedelta

# Importando do nosso core e services
from core.ui import renderizar_cabecalho, renderizar_navegacao_lateral
from services.ferias import (
    extrair_dados_pdf, carregar_historico, carregar_eventos, 
    obter_salario_epoca, arredondar, EVENTOS_MEDIAS
)

st.set_page_config(
    page_title="Conferência de Férias - Bwise & Maçaneiro", 
    layout="wide",
    initial_sidebar_state="expanded"
)

# Renderiza o cabeçalho padronizado global
renderizar_cabecalho("CONFERÊNCIA<br>RECIBO DE FÉRIAS")
renderizar_navegacao_lateral()

# -----------------------------------------------------------------------------
# MENU LATERAL (SIDEBAR) E INSTRUÇÕES
# -----------------------------------------------------------------------------
st.sidebar.markdown('### <span class="subtitulo">📁 Importação de Dados</span>', unsafe_allow_html=True)
pdf_file = st.sidebar.file_uploader("1. RECIBO FÉRIAS (PDF)", type=['pdf'])
eventos_file = st.sidebar.file_uploader("2. LISTA DE EVENTOS", type=['csv', 'xlsx', 'xls'])
historico_file = st.sidebar.file_uploader("3. HISTÓRICO DE CARGOS", type=['csv', 'xlsx', 'xls'])

if not (pdf_file and eventos_file and historico_file):
    with st.expander("📖 Como extrair os documentos do sistema (Passo a Passo)"):
        st.markdown("""
        ### 1. RECIBO DE FÉRIAS (PDF)
        **Caminho:** `Férias` ➔ `Controle de Período Aquisitivo e Concessivo` ➔ `Impressão de Documentos...`
        * Clicar em **Avançar** ➔ Selecionar funcionário ➔ Selecionar o último período de férias ➔ **Recibo de Férias**.
        * Salvar o arquivo no formato **PDF**.

        ---
        ### 2. LISTA DE EVENTOS DE RECIBO DE PAGAMENTO
        **Caminho:** `Folha de Pagamento` ➔ `Folha de Pagamento` ➔ `Lista de Eventos de Recibos de Pagamento...`
        * **Competência Inicial e Competência Final:** Selecionar o período aquisitivo.
        * **Tipo de Recibo:** `1 Normal`.
        * Clicar em **Filtrar** e salvar o arquivo.

        ---
        ### 3. HISTÓRICO DE CARGOS E SALÁRIOS
        **Caminho:** `Folha de Pagamento` ➔ `Cadastros` ➔ `Cargos` ➔ `Lista de Histórico de Cargos e Salários...`
        * **Situação do funcionário:** `Ativos`.
        * Salvar o arquivo.
        """)
    st.info("👈 Por favor, anexe os TRÊS documentos no menu lateral esquerdo para iniciar a conferência.")
    st.stop()

# -----------------------------------------------------------------------------
# PROCESSAMENTO E RESULTADOS
# -----------------------------------------------------------------------------
with st.spinner("⚙️ Processando informações do PDF e calculando médias..."):
    dados_pdf = extrair_dados_pdf(pdf_file)
    matricula = dados_pdf.get('matricula', 0)
    salario_atual = dados_pdf.get('salario', 0.0)

st.markdown('### <span class="subtitulo">📋 Resumo Extraído</span>', unsafe_allow_html=True)
st.write(f"**Matrícula:** {matricula}")
st.write(f"**Salário Contratual:** R$ {salario_atual:,.2f}")
if 'inicio_aquisitivo' in dados_pdf:
    st.write(f"**Período Aquisitivo:** {dados_pdf['inicio_aquisitivo'].strftime('%d/%m/%Y')} a {dados_pdf['fim_aquisitivo'].strftime('%d/%m/%Y')}")
st.markdown("---")

# --- PARTE 1: CONFERÊNCIA FÉRIAS E ABONO BASE ---
st.markdown('### <span class="subtitulo">1. Conferência Férias e Abono</span>', unsafe_allow_html=True)
valor_dia = salario_atual / 30

col_a, col_b = st.columns(2)

if 189 in dados_pdf['eventos']:
    ref_ferias = dados_pdf['eventos'][189]['referencia']
    valor_pdf_ferias = dados_pdf['eventos'][189]['provento']
    calc_ferias = arredondar(valor_dia * ref_ferias)
    with col_a:
        st.info(f"**0189 - FÉRIAS NORMAIS**\n\n"
                f"Cálculo: R$ {salario_atual:,.2f} / 30 * {ref_ferias} = **R$ {calc_ferias:,.2f}**\n\n"
                f"Valor no PDF: **R$ {valor_pdf_ferias:,.2f}**\n\n"
                f"Diferença: R$ {(calc_ferias - valor_pdf_ferias):,.2f}")
                
if 191 in dados_pdf['eventos']:
    ref_abono = dados_pdf['eventos'][191]['referencia']
    valor_pdf_abono = dados_pdf['eventos'][191]['provento']
    calc_abono = arredondar(valor_dia * ref_abono)
    with col_b:
        st.info(f"**0191 - ABONO PECUNIÁRIO**\n\n"
                f"Cálculo: R$ {salario_atual:,.2f} / 30 * {ref_abono} = **R$ {calc_abono:,.2f}**\n\n"
                f"Valor no PDF: **R$ {valor_pdf_abono:,.2f}**\n\n"
                f"Diferença: R$ {(calc_abono - valor_pdf_abono):,.2f}")

st.markdown("---")

# --- PARTE 2: CONFERÊNCIA DE MÉDIAS VARIÁVEIS ---
st.markdown('### <span class="subtitulo">2. Conferência de Médias de Variáveis</span>', unsafe_allow_html=True)

if 'inicio_aquisitivo' in dados_pdf:
    meses_calculo = []
    data_iter = dados_pdf['inicio_aquisitivo']
    for _ in range(12):
        meses_calculo.append((data_iter.month, data_iter.year))
        data_iter += relativedelta(months=1)

    try:
        df_hist = carregar_historico(historico_file, matricula)
        df_evt = carregar_eventos(eventos_file, matricula)
        
        total_medias_ajustadas = 0.0
        detalhes_medias = []
        
        for _, row in df_evt.iterrows():
            try:
                mes_evt, ano_evt, cod_evt = int(row['Mês']), int(row['Ano']), int(row['Cód. Evento'])
            except:
                continue
            
            if (mes_evt, ano_evt) in meses_calculo and cod_evt in EVENTOS_MEDIAS:
                valor_original = float(row['Valor Provento'])
                salario_epoca = obter_salario_epoca(df_hist, mes_evt, ano_evt)
                
                if salario_epoca and salario_epoca < salario_atual:
                    valor_ajustado = arredondar((valor_original / salario_epoca) * salario_atual)
                else:
                    valor_ajustado = arredondar(valor_original)
                    
                total_medias_ajustadas += valor_ajustado
                detalhes_medias.append(f"{mes_evt:02d}/{ano_evt} - Cód {cod_evt}: R$ {valor_original:,.2f} (Base: R$ {salario_epoca or salario_atual:,.2f}) -> Corrigido: R$ {valor_ajustado:,.2f}")

        media_mensal = arredondar(total_medias_ajustadas / 12)
        
        st.write(f"**Soma Total de Proventos Atualizados:** R$ {total_medias_ajustadas:,.2f}")
        st.write(f"**Média Apurada (A dividir por 12):** R$ {media_mensal:,.2f}")
        
        with st.expander("Ver detalhamento dos eventos de médias da competência"):
            for det in detalhes_medias:
                st.write(det)

        st.write("")
        col_c, col_d = st.columns(2)
        
        if 223 in dados_pdf['eventos']: 
            ref_med_ferias = dados_pdf['eventos'][223]['referencia']
            calc_med_ferias = arredondar((media_mensal / 30) * ref_med_ferias)
            with col_c:
                st.success(f"**0223 - MEDIAS S/ VARIAVEIS - FÉRIAS**\n\n"
                           f"Cálculo: R$ {media_mensal:,.2f} / 30 * {ref_med_ferias} = **R$ {calc_med_ferias:,.2f}**\n\n"
                           f"Valor PDF: **R$ {dados_pdf['eventos'][223]['provento']:,.2f}**\n\n"
                           f"Diferença: R$ {(calc_med_ferias - dados_pdf['eventos'][223]['provento']):,.2f}")
                           
        if 224 in dados_pdf['eventos']:
            ref_med_abono = dados_pdf['eventos'][224]['referencia']
            calc_med_abono = arredondar((media_mensal / 30) * ref_med_abono)
            with col_d:
                st.success(f"**0224 - MEDIAS S/ VARIAVEIS - ABONO**\n\n"
                           f"Cálculo: R$ {media_mensal:,.2f} / 30 * {ref_med_abono} = **R$ {calc_med_abono:,.2f}**\n\n"
                           f"Valor PDF: **R$ {dados_pdf['eventos'][224]['provento']:,.2f}**\n\n"
                           f"Diferença: R$ {(calc_med_abono - dados_pdf['eventos'][224]['provento']):,.2f}")
    
    except Exception as e:
        st.error(f"Erro durante o processamento das planilhas: {e}")
