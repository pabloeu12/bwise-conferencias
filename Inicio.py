"""
Inicio.py
─────────
Dashboard executivo — ponto de entrada da Plataforma de Auditoria Bwise.
"""

import streamlit as st
from core.ui import renderizar_cabecalho, renderizar_navegacao_lateral

st.set_page_config(
    page_title="Plataforma de Auditoria - Bwise",
    page_icon="assets/logo bwise.png",
    layout="wide",
    initial_sidebar_state="expanded",
)

renderizar_cabecalho("PLATAFORMA DE AUDITORIA<br>E CONFERÊNCIA", tag="Painel Executivo")
renderizar_navegacao_lateral("Início")

st.markdown(
    """
    <div style="text-align: center; max-width: 760px; margin: 0 auto 36px auto;">
        <h2 style="color: #1B1F2A; font-size: 1.85rem; font-weight: 800; margin-bottom: 12px;">
            Auditoria de folha inteligente e automatizada
        </h2>
        <p style="color: #667085; font-size: 1.05rem; line-height: 1.6;">
            Selecione um dos módulos abaixo ou utilize o menu lateral para iniciar
            a conferência dos seus documentos.
        </p>
    </div>
    """,
    unsafe_allow_html=True,
)

# ── Módulos disponíveis (dados usados para montar os cards) ─────────────────
MODULOS = [
    {
        "icone": "📋",
        "titulo": "Auditoria de Rubricas",
        "badge": "Cruzamento de Dados",
        "descricao": (
            "Compara planilhas de lançamentos com os extratos do sistema, "
            "identificando divergências de valores com precisão centesimal."
        ),
        "requisitos": "Requer: Lançamentos e Lista de Eventos",
        "pagina": "pages/1_Auditoria_de_Rubricas.py",
        "key": "abrir_rubricas",
    },
    {
        "icone": "💰",
        "titulo": "Adiantamento Salarial",
        "badge": "Comparativo Mensal",
        "descricao": (
            "Cruza admitidos, demitidos e férias para validar a proporcionalidade "
            "dos adiantamentos, com relatórios e painéis gráficos automáticos."
        ),
        "requisitos": "Requer: Ativos, Férias e Eventos",
        "pagina": "pages/2_Adiantamento_Salarial.py",
        "key": "abrir_adiantamento",
    },
    {
        "icone": "🏖️",
        "titulo": "Conferência de Férias",
        "badge": "Leitura de PDF",
        "descricao": (
            "Extrai dados do recibo em PDF e reconstrói o cálculo de médias de "
            "variáveis e abono pecuniário com reajustes salariais históricos."
        ),
        "requisitos": "Requer: PDF, Histórico e Eventos",
        "pagina": "pages/3_Conferencia_de_Ferias.py",
        "key": "abrir_ferias",
    },
    {
        "icone": "💳",
        "titulo": "Conferência de Consignados",
        "badge": "Limite de Desconto",
        "descricao": (
            "Cruza Emprega Brasil, recibos e eventos de pagamento para validar "
            "os valores descontados e o limite legal de 35% do salário."
        ),
        "requisitos": "Requer: Emprega Brasil, Recibos e Eventos",
        "pagina": "pages/4_Conferencia_de_Consignados.py",
        "key": "abrir_consignados",
    },
]

colunas = st.columns(4)
for coluna, modulo in zip(colunas, MODULOS):
    with coluna:
        st.markdown(
            f"""
            <div class="bwise-card">
                <div class="bwise-icon">{modulo['icone']}</div>
                <div class="bwise-badge">{modulo['badge']}</div>
                <div class="bwise-title">{modulo['titulo']}</div>
                <div class="bwise-desc">{modulo['descricao']}</div>
                <div class="bwise-footer">{modulo['requisitos']}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        if st.button("Abrir módulo", key=modulo["key"], type="primary"):
            st.switch_page(modulo["pagina"])

st.markdown(
    """
    <div class="bwise-footer-page">
        © 2026 Bwise Analytics. Todos os direitos reservados.
    </div>
    """,
    unsafe_allow_html=True,
)
