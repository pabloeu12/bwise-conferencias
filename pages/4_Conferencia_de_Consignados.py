"""
pages/4_Conferencia_de_Consignados.py
─────────────────────────────────────
Interface Visual do Módulo de Conferência de Consignados.
"""

import pandas as pd
import streamlit as st

from core.ui import renderizar_cabecalho, renderizar_navegacao_lateral
from services.consignados import executar_conferencia_consignados, gerar_excel_consignados

st.set_page_config(
    page_title="Conferencia de Consignados - Bwise & Maçaneiro",
    layout="wide",
    initial_sidebar_state="expanded",
)

renderizar_cabecalho("CONFERÊNCIA<br>DE CONSIGNADOS")
renderizar_navegacao_lateral("Conferencia de Consignados")

st.sidebar.markdown('### <span class="subtitulo">📁 Importação de Dados</span>', unsafe_allow_html=True)
file_emprega = st.sidebar.file_uploader("1. Emprega Brasil", type=["xlsx", "xls", "csv"])
file_recibos = st.sidebar.file_uploader("2. Lista de Recibo de Pagamento", type=["xlsx", "xls", "csv"])
file_eventos = st.sidebar.file_uploader("3. Lista de Eventos de Pagamento", type=["xlsx", "xls", "csv"])

if not (file_emprega and file_recibos and file_eventos):
    with st.expander("📖 Como extrair os documentos do sistema (Passo a Passo)"):
        st.markdown("""
        ### 1. Emprega Brasil
        Espaço reservado para inclusão dos passos futuramente.

        ---
        ### 2. Lista de Recibo de Pagamento
        **Caminho:** `Folha de Pagamento` ➔ `Folha de Pagamento` ➔ `Lista de Recibos de Pagamento...`

        * **Competência Inicial e Competência Final:** selecionar o mês atual.
        * **Tipo de Recibo:** `1 Normal`.
        * Clique em **Filtrar** e salve o arquivo nos formatos **.CSV**, **.XLS** ou **.XLSX**.

        ---
        ### 3. Lista de Eventos de Pagamento
        **Caminho:** `Folha de Pagamento` ➔ `Folha de Pagamento` ➔ `Lista de Eventos de Recibos de Pagamento...`

        * **Competência Inicial e Competência Final:** selecionar o mês atual.
        * **Tipo de Recibo:** `1 Normal`.
        * Clique em **Filtrar** e salve o arquivo nos formatos **.CSV**, **.XLS** ou **.XLSX**.
        """)
    st.info("👈 Por favor, anexe os TRÊS arquivos no menu lateral para iniciar a conferência.")
    st.stop()

col_btn, _ = st.columns([1, 3])
with col_btn:
    processar = st.button("⚡ INICIAR CONFERÊNCIA", type="primary")

if processar:
    with st.spinner("⚙️ Cruzando Emprega Brasil, recibos e eventos de pagamento..."):
        try:
            resultados, meta = executar_conferencia_consignados(file_emprega, file_recibos, file_eventos)
        except Exception as exc:
            st.error(f"❌ Erro ao processar os arquivos: {exc}")
            st.stop()

    st.session_state["resultados_consignados"] = resultados
    st.session_state["meta_consignados"] = meta
    st.session_state["df_consignados"] = pd.DataFrame(resultados)
    st.success(f"✅ Conferência concluída com sucesso! ({meta['total_funcionarios']} funcionários processados)")

if "df_consignados" not in st.session_state:
    st.info("Clique em **INICIAR CONFERÊNCIA** para processar os arquivos anexados.")
    st.stop()

df = st.session_state["df_consignados"]
meta = st.session_state["meta_consignados"]
resultados = st.session_state["resultados_consignados"]

st.markdown("<br>", unsafe_allow_html=True)
st.markdown('### <span class="subtitulo">📊 Resumo Geral</span>', unsafe_allow_html=True)
m1, m2, m3, m4 = st.columns(4)
m1.metric("Funcionários Processados", meta["total_funcionarios"])
m2.metric("Corretos", meta["total_corretos"])
m3.metric("Com Divergência", meta["total_errados"])
m4.metric("Limites 35% Ultrapassados", meta["limites_ultrapassados"])

st.markdown("---")
st.markdown('### <span class="subtitulo">🔍 Filtros</span>', unsafe_allow_html=True)
fc1, fc2, fc3 = st.columns([1.2, 2, 2])

with fc1:
    filtro_status = st.selectbox("Status", ["Todos", "Certo", "Errado"])
with fc2:
    filtro_nome = st.text_input("Funcionário", placeholder="Ex: MARIA")
with fc3:
    filtro_matricula = st.text_input("Matrícula", placeholder="Ex: 276")

df_filtrado = df.copy()
if filtro_status != "Todos":
    df_filtrado = df_filtrado[df_filtrado["Status"] == filtro_status]
if filtro_nome.strip():
    df_filtrado = df_filtrado[df_filtrado["Nome do funcionário"].str.contains(filtro_nome.strip(), case=False, na=False)]
if filtro_matricula.strip():
    df_filtrado = df_filtrado[df_filtrado["Matrícula"].astype(str).str.contains(filtro_matricula.strip(), na=False)]

st.caption(f"A exibir {len(df_filtrado)} de {len(df)} funcionários")

def colorir_status(val):
    if val == "Certo":
        return "background-color: #d4edda; color: #155724;"
    return "background-color: #f8d7da; color: #721c24;"

colunas_moeda = [
    "Base de Cálculo do INSS",
    "Valor do INSS",
    "Valor do IRRF",
    "Férias",
    "Base",
    "Limite de Desconto (35%)",
    "EMPRESTIMO (EMPREGA BRASIL)",
    "EMPRESTIMO (LISTA DE EVENTOS DE RECIBO DE PAGAMENTO)",
    "Diferença (Emprega Brasil x Lista de Eventos)",
    "Diferença (Limite de Desconto x Lista de Eventos)",
]

st.dataframe(
    df_filtrado.style.map(colorir_status, subset=["Status"]).format({col: "R$ {:.2f}" for col in colunas_moeda}),
    use_container_width=True,
    height=420,
    hide_index=True,
)

st.markdown("<br>", unsafe_allow_html=True)
st.markdown('### <span class="subtitulo">⬇️ Exportar Relatório</span>', unsafe_allow_html=True)
excel_bytes = gerar_excel_consignados(resultados, meta)

st.download_button(
    label="📥 Baixar Conferência de Consignados",
    data=excel_bytes,
    file_name="Resultado_Conferencia_Consignados.xlsx",
    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    type="primary",
)
