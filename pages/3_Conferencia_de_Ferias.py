"""
pages/3_Ferias.py
──────────────────────
Interface Visual do Módulo de Conferência de Férias.
"""

import streamlit as st

# Importando do nosso core e services
from core.ui import renderizar_cabecalho, renderizar_navegacao_lateral
from services.ferias import processar_auditoria_ferias

st.set_page_config(
    page_title="Conferência de Férias - Bwise & Maçaneiro",
    page_icon="assets/logo bwise.png",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Renderiza o cabeçalho padronizado global
renderizar_cabecalho("CONFERÊNCIA<br>RECIBO DE FÉRIAS")
renderizar_navegacao_lateral("Conferencia de Férias")

# -----------------------------------------------------------------------------
# MENU LATERAL (SIDEBAR) E INSTRUÇÕES
# -----------------------------------------------------------------------------
st.sidebar.markdown('### <span class="subtitulo">Importação de Dados</span>', unsafe_allow_html=True)
pdf_file = st.sidebar.file_uploader("1. RECIBO FÉRIAS (PDF)", type=['pdf'])
eventos_file = st.sidebar.file_uploader("2. LISTA DE EVENTOS", type=['csv', 'xlsx', 'xls'])
historico_file = st.sidebar.file_uploader("3. HISTÓRICO DE CARGOS", type=['csv', 'xlsx', 'xls'])

if not (pdf_file and eventos_file and historico_file):
    with st.expander("Como extrair os documentos do sistema (Passo a Passo)"):
        st.markdown("""
        ### 1. RECIBO DE FÉRIAS (PDF)
        **Caminho:** `Folha de Pagamento` ➔ `Férias` ➔ `Impressão de Documentos...`
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
    st.info("Por favor, anexe os TRÊS documentos no menu lateral esquerdo para iniciar a conferência.")
    st.stop()

# -----------------------------------------------------------------------------
# PROCESSAMENTO E RESULTADOS
# -----------------------------------------------------------------------------
# Usa a mesma função de services/ferias.py chamada pelo backend FastAPI (app.py),
# para garantir que Streamlit e Next.js sempre calculem exatamente igual.
with st.spinner("Processando informações do PDF e calculando médias..."):
    try:
        resultado = processar_auditoria_ferias(pdf_file, eventos_file, historico_file)
    except Exception as e:
        st.error(f"Erro durante o processamento dos documentos: {e}")
        st.stop()

matricula = resultado['matricula']
salario_atual = resultado['salario_contratual']

st.markdown('### <span class="subtitulo">Resumo Extraído</span>', unsafe_allow_html=True)
st.write(f"**Matrícula:** {matricula}")
st.write(f"**Salário Contratual:** R$ {salario_atual:,.2f}")
if resultado['periodo_aquisitivo'] != 'Não Identificado':
    st.write(f"**Período Aquisitivo:** {resultado['periodo_aquisitivo']}")
st.markdown("---")

# --- PARTE 1: CONFERÊNCIA FÉRIAS E ABONO BASE ---
st.markdown('### <span class="subtitulo">1. Conferência Férias e Abono</span>', unsafe_allow_html=True)
col_a, col_b = st.columns(2)

v_ferias = next((v for v in resultado['verificacoes_base'] if v['evento'].startswith('0189')), None)
v_abono = next((v for v in resultado['verificacoes_base'] if v['evento'].startswith('0191')), None)

if v_ferias:
    with col_a:
        st.info(f"**{v_ferias['evento']}**\n\n"
                f"Cálculo: {v_ferias['formula']} = **R$ {v_ferias['calculado']:,.2f}**\n\n"
                f"Valor no PDF: **R$ {v_ferias['pdf']:,.2f}**\n\n"
                f"Diferença: R$ {v_ferias['diferenca']:,.2f}")

if v_abono:
    with col_b:
        st.info(f"**{v_abono['evento']}**\n\n"
                f"Cálculo: {v_abono['formula']} = **R$ {v_abono['calculado']:,.2f}**\n\n"
                f"Valor no PDF: **R$ {v_abono['pdf']:,.2f}**\n\n"
                f"Diferença: R$ {v_abono['diferenca']:,.2f}")

st.markdown("---")

# --- PARTE 2: CONFERÊNCIA DE MÉDIAS VARIÁVEIS ---
st.markdown('### <span class="subtitulo">2. Conferência de Médias de Variáveis</span>', unsafe_allow_html=True)

st.write(f"**Soma Total de Proventos Atualizados:** R$ {resultado['total_proventos_atualizados']:,.2f}")
st.write(f"**Média Apurada (A dividir por 12):** R$ {resultado['media_mensal_apurada']:,.2f}")

with st.expander("Ver detalhamento dos eventos de médias da competência"):
    for det in resultado['detalhes_medias']:
        st.write(det)

st.write("")
col_c, col_d = st.columns(2)

v_med_ferias = next((v for v in resultado['verificacoes_medias'] if v['evento'].startswith('0223')), None)
v_med_abono = next((v for v in resultado['verificacoes_medias'] if v['evento'].startswith('0224')), None)

if v_med_ferias:
    with col_c:
        st.success(f"**{v_med_ferias['evento']}**\n\n"
                   f"Cálculo: {v_med_ferias['formula']} = **R$ {v_med_ferias['calculado']:,.2f}**\n\n"
                   f"Valor PDF: **R$ {v_med_ferias['pdf']:,.2f}**\n\n"
                   f"Diferença: R$ {v_med_ferias['diferenca']:,.2f}")

if v_med_abono:
    with col_d:
        st.success(f"**{v_med_abono['evento']}**\n\n"
                   f"Cálculo: {v_med_abono['formula']} = **R$ {v_med_abono['calculado']:,.2f}**\n\n"
                   f"Valor PDF: **R$ {v_med_abono['pdf']:,.2f}**\n\n"
                   f"Diferença: R$ {v_med_abono['diferenca']:,.2f}")
