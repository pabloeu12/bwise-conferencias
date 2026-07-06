"""
pages/1_Rubricas.py
───────────────────────
Interface Visual do Módulo de Conferência de Rubricas.
"""

import streamlit as st
import pandas as pd
from io import BytesIO

# Importando do nosso core e services
from core.ui import renderizar_cabecalho, renderizar_navegacao_lateral
from services.comparador import executar_comparacao, gerar_excel

st.set_page_config(
    page_title="Conferência de Rubricas - Bwise & Maçaneiro", 
    layout="wide",
    initial_sidebar_state="expanded"
)

# Renderiza o cabeçalho padronizado (que já injeta o CSS global)
renderizar_cabecalho("CONFERÊNCIA<br>DE RUBRICAS")
renderizar_navegacao_lateral()

# -----------------------------------------------------------------------------
# MENU LATERAL (SIDEBAR)
# -----------------------------------------------------------------------------
with st.sidebar:
    st.markdown('### <span class="subtitulo">📁 Importação de Dados</span>', unsafe_allow_html=True)
    st.markdown("<br>", unsafe_allow_html=True)
    
    st.markdown("**1. Upload: PLANILHA DE LANÇAMENTOS**")
    arq_lanc = st.file_uploader(
        "Upload Lançamentos", 
        type=["xlsx", "csv"], 
        key="lanc", 
        label_visibility="collapsed"
    )
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    st.markdown("**2. Upload: PLANILHA DO SISTEMA**")
    arq_sist = st.file_uploader(
        "Upload Sistema", 
        type=["xlsx", "csv"], 
        key="sist", 
        label_visibility="collapsed"
    )

# -----------------------------------------------------------------------------
# TELA INICIAL (SEM ARQUIVOS) - PASSO A PASSO
# -----------------------------------------------------------------------------
if not arq_lanc or not arq_sist:
    with st.expander("📖 Como extrair as planilhas do Sistema (Passo a Passo)"):
        st.markdown("### 1️⃣ PLANILHA DE LANÇAMENTOS")
        st.markdown("""
        * **Origem:** Recebemos a planilha da Maçaneiro diretamente via e-mail.
        * **Divisão:** O arquivo original costuma vir dividido em três partes (**ADM, Motoristas e Manobra**). 
          * *Nota:* Você pode optar por unificar as abas/arquivos em uma só ou realizar o processo de conferência de forma separada no sistema.
        * **Ajustes Obrigatórios antes de anexar:**
          * Remover completamente todas as fórmulas e formatações de células.
          * Garantir que a **primeira linha** da planilha seja estritamente o cabeçalho e as linhas seguintes contenham apenas os dados/conteúdos.
        """)
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        st.markdown("### 2️⃣ LISTA DE EVENTOS DE RECIBO DE PAGAMENTO (Sistema)")
        st.markdown("""
        * **Caminho para extração no sistema:**
          * Folha de Pagamento ➔ Folha de Pagamento ➔ Lista de Eventos de Recibos de Pagamento...
        """)
        
    st.info("👉 Por favor, anexe as DUAS planilhas no menu lateral para iniciar a conferência.")
    st.stop()

# -----------------------------------------------------------------------------
# COMPARAÇÃO E RESULTADOS
# -----------------------------------------------------------------------------
col_btn, _ = st.columns([1, 3])
with col_btn:
    btn_comparar = st.button("⚡ INICIAR COMPARAÇÃO", type="primary")

if btn_comparar:
    with st.spinner("⚙️ Processando cruzamento de dados..."):
        try:
            resultados = executar_comparacao(
                BytesIO(arq_lanc.read()),
                BytesIO(arq_sist.read()),
            )
        except Exception as e:
            st.error(f"❌ Erro na comparação: {e}")
            st.stop()

    if not resultados:
        st.warning("⚠️ Nenhum evento foi comparado. Verifique os arquivos.")
        st.stop()

    df = pd.DataFrame(resultados)
    st.session_state["df_rubricas"] = df
    st.session_state["resultados_rubricas"] = resultados
    st.success(f"✅ Comparação concluída com sucesso! ({len(df)} eventos processados)")

if "df_rubricas" in st.session_state:
    df = st.session_state["df_rubricas"]
    resultados = st.session_state["resultados_rubricas"]

    total   = len(df)
    ok_tot  = df["Status"].str.startswith("OK").sum()
    diverg  = (df["Status"] == "DIVERGENTE").sum()
    nao_enc = (df["Status"] == "NAO_ENCONTRADO").sum()

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown('### <span class="subtitulo">📊 Resultado Geral</span>', unsafe_allow_html=True)

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Eventos Comparados", total)
    m2.metric("Conferidos OK ✅", ok_tot)
    m3.metric("Divergências ❌", diverg)
    m4.metric("Não Encontrados ⚠️", nao_enc)

    st.markdown("---")

    st.markdown('### <span class="subtitulo">🔍 Filtros</span>', unsafe_allow_html=True)
    fc1, fc2, fc3 = st.columns([1.5, 2, 2])

    with fc1:
        opcoes_status = ["Todos"] + sorted(df["Status"].unique().tolist())
        filtro_status = st.selectbox("Status", opcoes_status)

    with fc2:
        filtro_func = st.text_input("Funcionário (Nome ou Matrícula)", placeholder="Ex: JOSE ou 276")

    with fc3:
        todos_eventos = sorted(df["Nome do Evento"].unique().tolist())
        filtro_evento = st.multiselect("Evento / Rubrica", todos_eventos, placeholder="Todos")

    df_filtrado = df.copy()
    if filtro_status != "Todos":
        df_filtrado = df_filtrado[df_filtrado["Status"] == filtro_status]
    if filtro_func.strip():
        mask = (
            df_filtrado["Funcionário"].str.contains(filtro_func.strip(), case=False, na=False)
            | df_filtrado["Matrícula"].astype(str).str.contains(filtro_func.strip(), na=False)
        )
        df_filtrado = df_filtrado[mask]
    if filtro_evento:
        df_filtrado = df_filtrado[df_filtrado["Nome do Evento"].isin(filtro_evento)]

    st.caption(f"A exibir {len(df_filtrado)} de {total} eventos")

    def colorir_linha(row):
        status = row["Status"]
        if "OK" in str(status):
            cor = "background-color: #d4edda; color: #155724;"
        elif status == "DIVERGENTE":
            cor = "background-color: #f8d7da; color: #721c24;"
        elif status == "NAO_ENCONTRADO":
            cor = "background-color: #fff3cd; color: #856404;"
        else:
            cor = ""
        return [cor] * len(row)

    st.dataframe(
        df_filtrado.style.apply(colorir_linha, axis=1),
        use_container_width=True,
        height=400,
        hide_index=True,
    )

    st.markdown("<br>", unsafe_allow_html=True)

    st.markdown('### <span class="subtitulo">⬇️ Exportar Relatório</span>', unsafe_allow_html=True)
    excel_bytes = gerar_excel(resultados)

    st.download_button(
        label="📥 Baixar Planilha de Divergências",
        data=excel_bytes,
        file_name="Relatorio_Divergencias.xlsx",
        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        type="primary"
    )
