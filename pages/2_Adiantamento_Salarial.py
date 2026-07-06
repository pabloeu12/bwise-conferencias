"""
pages/2_Adiantamento.py
────────────────────────
Interface Visual do Módulo de Conferência de Adiantamento Salarial.
"""

import streamlit as st
import pandas as pd
import altair as alt

# Importando do nosso core e services
from core.ui import renderizar_cabecalho, renderizar_navegacao_lateral
from core.utils import formatar_moeda_br
from services.adiantamento import processar_dados, gerar_excel_formatado

st.set_page_config(
    page_title="Conferência de Adiantamento - Bwise & Maçaneiro", 
    layout="wide",
    initial_sidebar_state="expanded"
)

# Renderiza o cabeçalho padronizado global
renderizar_cabecalho("CONFERÊNCIA<br>ADIANTAMENTO SALARIAL")
renderizar_navegacao_lateral("Adiantamento Salarial")

# -----------------------------------------------------------------------------
# MENU LATERAL (SIDEBAR)
# -----------------------------------------------------------------------------
st.sidebar.markdown('### <span class="subtitulo">📁 Importação de Dados</span>', unsafe_allow_html=True)
file_eventos = st.sidebar.file_uploader("1. Upload: LISTA DE EVENTOS", type=["xlsx", "csv"])
file_ativos  = st.sidebar.file_uploader("2. Upload: LISTA DE ATIVOS", type=["xlsx", "csv"])
file_ferias  = st.sidebar.file_uploader("3. Upload: LISTA DE FÉRIAS", type=["xlsx", "csv"])

# -----------------------------------------------------------------------------
# TELA INICIAL (SEM ARQUIVOS)
# -----------------------------------------------------------------------------
if not (file_eventos and file_ativos and file_ferias):
    with st.expander("📖 Como extrair as planilhas do KMM (Passo a Passo)"):
        st.markdown("""
        ### 1. LISTA DE EVENTOS DE RECIBO DE PAGAMENTO
        **Caminho:** `Folha de Pagamento` ➔ `Folha de Pagamento` ➔ `Lista de Eventos de Recibos de Pagamento...`
        * **Competência Inicial:** Último adiantamento processado (mês anterior)
        * **Competência Final:** Adiantamento atual que está validando (mês atual)
        * **Tipo de Recibo:** `2 Adiantamento`
        * Clicar em **"Filtrar"** e salvar.

        ---
        ### 2. LISTA DE FUNCIONÁRIOS ATIVOS
        **Caminho:** `Folha de Pagamento` ➔ `Funcionários` ➔ `Registro...`
        * Clicar em **"Listar..."**
        * **Situação:** `Ativos`
        * Clicar em **"Filtrar"** e salvar.

        ---
        ### 3. LISTA DE PERÍODOS AQUISITIVOS E CONCESSIVOS (FÉRIAS)
        **Caminho:** `Folha de Pagamento` ➔ `Férias` ➔ `Lista de Períodos Aquisitivos e Concessivos...`
        * Clicar em **"Filtrar"** e salvar.
        """)
    st.info("👈 Por favor, anexe as TRÊS planilhas no menu lateral para iniciar a conferência.")
    st.stop()

# -----------------------------------------------------------------------------
# PROCESSAMENTO E RESULTADOS
# -----------------------------------------------------------------------------
with st.spinner("⚙️ Processando dados, férias e aplicando regras de negócio..."):
    try:
        df_final, mes_ant, mes_atu, tot_ant_global, tot_atu_global = processar_dados(file_eventos, file_ativos, file_ferias)
    except Exception as e:
        st.error(f"❌ Erro ao processar: {e}")
        st.stop()

st.success(f"✅ Dados processados com sucesso! Comparando Mês {mes_ant} x Mês {mes_atu}.")

# --- FILTROS ---
st.markdown('### <span class="subtitulo">🔍 Filtros de Busca</span>', unsafe_allow_html=True)
col_f1, col_f2, col_f3 = st.columns(3)

with col_f1: f_nome = st.text_input("Buscar por Nome")
with col_f2: f_mat = st.text_input("Buscar por Matrícula")
with col_f3:
    filtros_status = ["Todos", "Certo", "Certo (Férias)", "Errado", "Funcionário Novo", "Sem adiantamento (opcional)", "Não tem direito (admitido após dia 6)"]
    f_status = st.selectbox("Filtrar por Status", filtros_status)

df_filtrado = df_final.copy()
if f_nome: df_filtrado = df_filtrado[df_filtrado['Nome'].str.contains(f_nome, case=False, na=False)]
if f_mat:  df_filtrado = df_filtrado[df_filtrado['Matricula'].str.contains(f_mat, case=False, na=False)]
if f_status != "Todos": df_filtrado = df_filtrado[df_filtrado['Status'] == f_status]

# --- RESUMO GERAL ---
st.markdown("---")
st.markdown('### <span class="subtitulo">📊 Resumo Geral</span>', unsafe_allow_html=True)
m1, m2, m3, m4 = st.columns(4)
m1.metric("Ativos", len(df_final))

corretos = len(df_final[df_final['Status'].str.contains('Certo')])
m2.metric("Corretos", corretos)

m3.metric("Com Divergência", len(df_final[df_final['Status'] == 'Errado']))
isentos = ['Funcionário Novo', 'Sem adiantamento (opcional)', 'Não tem direito (admitido após dia 6)']
m4.metric("Isentos (Novos/Opcional)", len(df_final[df_final['Status'].isin(isentos)]))

dif_total_global = tot_atu_global - tot_ant_global

# --- TABELA DE RESULTADOS E DOWNLOAD ---
st.markdown("---")
st.markdown('### <span class="subtitulo">📋 Tabela de Conferência (Por Empregado)</span>', unsafe_allow_html=True)

excel_ready = gerar_excel_formatado(df_filtrado, mes_ant, mes_atu)
st.download_button(
    label="📥 Baixar Tabela de Conferência (Excel Formatado)",
    data=excel_ready,
    file_name=f"Conferencia_Adiantamentos_Mes_{mes_atu}.xlsx",
    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    type="primary"
)

st.write("")

def colorir_status(val):
    if 'Certo' in val: return 'background-color: #d4edda; color: #155724'
    elif val == 'Errado': return 'background-color: #f8d7da; color: #721c24'
    elif val == 'Funcionário Novo': return 'background-color: #cce5ff; color: #004085'
    elif val == 'Não tem direito (admitido após dia 6)': return 'background-color: #fff3cd; color: #856404'
    else: return 'background-color: #e2e3e5; color: #383d41'
    
st.dataframe(
    df_filtrado.style.map(colorir_status, subset=['Status'])\
                .format({
                    "Salario": "R$ {:.2f}", 
                    f"Adiantamento (Mês {mes_ant})": "R$ {:.2f}", 
                    f"Adiantamento (Mês {mes_atu})": "R$ {:.2f}",
                    "Diferença Entre Meses": "R$ {:.2f}"
                }),
    use_container_width=True,
    height=350,
    hide_index=True
)

# --- ANÁLISES GRÁFICAS ---
st.markdown("---")
st.markdown('### <span class="subtitulo">📈 Análises Gráficas da Empresa</span>', unsafe_allow_html=True)

st.markdown("<br><b>Comparativo de Adiantamentos (Mês a Mês)</b>", unsafe_allow_html=True)
g1, g2 = st.columns(2)

df_grafico = pd.DataFrame({
    "Mês": [f"Mês {mes_ant}", f"Mês {mes_atu}"],
    "Total Pago": [tot_ant_global, tot_atu_global]
})
df_grafico['Rótulo'] = df_grafico['Total Pago'].apply(formatar_moeda_br)

with g1:
    base_chart = alt.Chart(df_grafico).encode(x=alt.X('Mês:N', sort=None))
    
    bars = base_chart.mark_bar(color="#1E3A8A").encode(
        y=alt.Y('Total Pago:Q', title="Total Pago (R$)"),
        tooltip=['Mês', 'Rótulo']
    )
    
    text_labels = base_chart.mark_text(
        align='center',
        baseline='bottom',
        dy=-5,
        fontWeight='bold',
        fontSize=13,
        color='#1E3A8A'
    ).encode(
        y=alt.Y('Total Pago:Q'),
        text='Rótulo:N'
    )
    
    st.altair_chart((bars + text_labels).properties(height=300), use_container_width=True)

with g2:
    pie = alt.Chart(df_grafico).mark_arc(innerRadius=0, outerRadius=100).encode(
        theta=alt.Theta(field="Total Pago", type="quantitative"),
        color=alt.Color(field="Mês", type="nominal", scale=alt.Scale(range=['#1E3A8A', '#F59E0B'])),
        tooltip=['Mês', 'Rótulo']
    ).properties(height=300)
    st.altair_chart(pie, use_container_width=True)

st.write("")
st.markdown("<b>Diferença da Empresa (Mês Atual x Anterior)</b>", unsafe_allow_html=True)

df_diff = pd.DataFrame({
    "Indicador": [f"Variação Mês {mes_ant} ➔ Mês {mes_atu}"],
    "Valor": [dif_total_global]
})
df_diff['Rótulo'] = df_diff['Valor'].apply(formatar_moeda_br)

cor_diff = "#28a745" if dif_total_global >= 0 else "#dc3545"

base_diff = alt.Chart(df_diff).encode(x=alt.X('Indicador:N'))

bars_diff = base_diff.mark_bar(size=140, color=cor_diff).encode(
    y=alt.Y('Valor:Q', title="Diferença (R$)"),
    tooltip=['Indicador', 'Rótulo']
)

text_diff = base_diff.mark_text(
    align='center',
    baseline='bottom' if dif_total_global >= 0 else 'top',
    dy=-7 if dif_total_global >= 0 else 7,
    fontWeight='bold',
    fontSize=14,
    color=cor_diff
).encode(
    y=alt.Y('Valor:Q'),
    text='Rótulo:N'
)

st.altair_chart((bars_diff + text_diff).properties(height=300, width=400), use_container_width=False)
