"""
Inicio.py
────────────
Dashboard Executivo (Ponto de entrada SaaS)
"""

import streamlit as st
from core.ui import renderizar_cabecalho, renderizar_navegacao_lateral

st.set_page_config(
    page_title="Plataforma de Auditoria - Bwise",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Renderiza o novo cabeçalho executivo
renderizar_cabecalho("PLATAFORMA DE AUDITORIA<br>E CONFERÊNCIA")
renderizar_navegacao_lateral()

# Texto de boas-vindas com design limpo
st.markdown(
    """
    <div style="text-align: center; max-width: 800px; margin: 0 auto 40px auto;">
        <h2 style="color: #0F172A; font-size: 2rem; font-weight: 800; margin-bottom: 16px;">
            Auditoria de Folha Inteligente e Automatizada
        </h2>
        <p style="color: #64748B; font-size: 1.1rem; line-height: 1.6;">
            Bem-vindo ao seu painel de controle. Selecione um dos módulos de inteligência 
            abaixo ou utilize o menu lateral para iniciar a análise em lote dos seus documentos.
        </p>
    </div>
    """,
    unsafe_allow_html=True,
)

# ── Cards Premium dos Módulos ──────────────────────────────────────────────────
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.markdown(
        """
        <div class="saas-card">
            <div class="saas-badge">MÓDULO DE INTELIGÊNCIA</div>
            <div class="saas-title">📋 Auditoria de Rubricas</div>
            <div class="saas-desc">
                Motor de cruzamento de dados em alta velocidade. Valida planilhas horizontais de lançamentos contra extratos KMM, identificando divergências centesimais com precisão absoluta.
            </div>
            <div class="saas-footer">
                🚀 Requer: Lançamentos & Lista de Eventos
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

with col2:
    st.markdown(
        """
        <div class="saas-card">
            <div class="saas-badge">MÓDULO DE INTELIGÊNCIA</div>
            <div class="saas-title">💰 Adiantamento Salarial</div>
            <div class="saas-desc">
                Análise preditiva de pagamentos. Cruza admitidos, demitidos e férias para garantir a proporcionalidade exata dos adiantamentos (evento 100), com geração de relatórios e painéis gráficos.
            </div>
            <div class="saas-footer">
                🚀 Requer: Ativos, Férias & Eventos
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

with col3:
    st.markdown(
        """
        <div class="saas-card">
            <div class="saas-badge">MÓDULO DE INTELIGÊNCIA</div>
            <div class="saas-title">🏖️ Conferência de Férias</div>
            <div class="saas-desc">
                Leitura nativa de PDF. Extrai dados contratuais e reconstrói o cálculo de médias de variáveis e abono pecuniário, aplicando reajustes salariais históricos de forma automática.
            </div>
            <div class="saas-footer">
                🚀 Requer: PDF, Histórico & Eventos
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

with col4:
    st.markdown(
        """
        <div class="saas-card">
            <div class="saas-badge">MÓDULO DE INTELIGÊNCIA</div>
            <div class="saas-title">💳 Conferencia de Consignados</div>
            <div class="saas-desc">
                Conferência dos descontos de empréstimos consignados. Cruza Emprega Brasil, recibos e eventos de pagamento para validar valores descontados e limite de 35%.
            </div>
            <div class="saas-footer">
                🚀 Requer: Emprega Brasil, Recibos & Eventos
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

# ── Rodapé Minimalista ────────────────────────────────────────────────────────
st.markdown(
    """
    <div style="text-align: center; margin-top: 60px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
        <p style="color: #94A3B8; font-size: 0.85rem; font-weight: 500;">
            © 2026 Bwise Analytics. Todos os direitos reservados.
        </p>
    </div>
    """,
    unsafe_allow_html=True,
)
