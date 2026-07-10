"""
core/ui.py
──────────
Componentes visuais e injeção de CSS globais da Plataforma de Auditoria Bwise.

Identidade visual baseada na marca Bwise (grafite + verde), extraída da logo
oficial em assets/. Este módulo concentra 100% do estilo do sistema para que
qualquer ajuste futuro seja feito em um único lugar.
"""

import os
import streamlit as st

# ════════════════════════════════════════════════════════════
# PALETA DE MARCA (Bwise)
# ════════════════════════════════════════════════════════════
COR_GRAFITE       = "#232838"   # cor principal de texto / botões primários
COR_GRAFITE_CLARO = "#3A4059"
COR_VERDE         = "#00D573"   # verde de marca (destaques, sucesso, ativo)
COR_VERDE_ESCURO  = "#00B863"
COR_FUNDO         = "#F6F7F9"
COR_SUPERFICIE    = "#FFFFFF"
COR_BORDA         = "#E3E6EC"
COR_TEXTO         = "#1B1F2A"
COR_TEXTO_SEC     = "#667085"

PAGINAS_APP = [
    ("Início", "Inicio.py", "🏠"),
    ("Auditoria de Rubricas", "pages/1_Auditoria_de_Rubricas.py", "📋"),
    ("Adiantamento Salarial", "pages/2_Adiantamento_Salarial.py", "💰"),
    ("Conferencia de Férias", "pages/3_Conferencia_de_Ferias.py", "🏖️"),
    ("Conferencia de Consignados", "pages/4_Conferencia_de_Consignados.py", "💳"),
]


def injetar_css_global():
    """Injeta o design system completo da plataforma (SaaS corporativo)."""
    st.markdown(
        """
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        html, body, [class*="css"] {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* 1. Esconder elementos padrão do Streamlit, mantendo o controle de recolher a sidebar */
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        [data-testid="stToolbar"] {visibility: hidden;}
        [data-testid="stDecoration"] {display: none;}
        /* O botão de reabrir a sidebar recolhida vive dentro da toolbar acima;
           sem esta regra ele ficaria escondido junto com o resto da toolbar,
           deixando a sidebar recolhida sem forma de reabrir. */
        [data-testid="stExpandSidebarButton"] {
            visibility: visible !important;
        }

        /* 2. Fundo geral e espaçamento */
        .stApp {
            background-color: #F6F7F9;
        }
        .block-container {
            padding-top: 1.75rem !important;
            padding-bottom: 3rem !important;
            max-width: 1200px;
        }
        h1, h2, h3 { color: #1B1F2A; }

        /* ── 3. BOTÕES ─────────────────────────────────────────────── */
        .stButton > button {
            width: 100%;
            border-radius: 10px;
            font-weight: 600;
            font-size: 0.92rem;
            padding: 0.55rem 1rem;
            transition: all 0.18s ease;
            border: 1px solid #E3E6EC;
            background-color: #FFFFFF;
            color: #232838;
            box-shadow: none;
        }
        .stButton > button:hover {
            border-color: #232838;
            color: #232838;
            transform: translateY(-1px);
        }
        .stButton > button:active { transform: translateY(0); }
        .stButton > button[kind="primary"] {
            background-color: #232838;
            color: #FFFFFF;
            border: 1px solid #232838;
            box-shadow: 0 2px 8px rgba(35, 40, 56, 0.18);
        }
        .stButton > button[kind="primary"]:hover {
            background-color: #12151d;
            border-color: #12151d;
            box-shadow: 0 6px 14px rgba(35, 40, 56, 0.24);
        }
        .stButton > button:disabled {
            opacity: 0.55;
            transform: none;
        }
        .stDownloadButton > button {
            width: 100%;
            border-radius: 10px;
            font-weight: 600;
            background-color: #00D573;
            color: #0B2015;
            border: 1px solid #00D573;
            box-shadow: 0 2px 8px rgba(0, 213, 115, 0.25);
            transition: all 0.18s ease;
        }
        .stDownloadButton > button:hover {
            background-color: #00B863;
            border-color: #00B863;
            transform: translateY(-1px);
        }

        /* ── 4. CARDS DOS MÓDULOS (Dashboard) ──────────────────────── */
        .bwise-card {
            position: relative;
            background: #FFFFFF;
            border-radius: 14px;
            padding: 22px 22px 18px 22px;
            border: 1px solid #E3E6EC;
            transition: all 0.22s ease;
            height: 100%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .bwise-card::before {
            content: "";
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 4px;
            background: linear-gradient(90deg, #00D573, #00B863);
            opacity: 0;
            transition: opacity 0.2s ease;
        }
        .bwise-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 16px 28px -12px rgba(23, 27, 38, 0.18);
            border-color: #232838;
        }
        .bwise-card:hover::before { opacity: 1; }
        .bwise-icon {
            width: 42px; height: 42px;
            border-radius: 10px;
            background: #EAFBF2;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.25rem;
            margin-bottom: 14px;
        }
        .bwise-badge {
            background-color: #F1F2F6;
            color: #4B5266;
            padding: 3px 10px;
            border-radius: 999px;
            font-size: 0.68rem;
            font-weight: 700;
            letter-spacing: 0.06em;
            display: inline-block;
            margin-bottom: 12px;
            width: max-content;
            text-transform: uppercase;
        }
        .bwise-title {
            color: #1B1F2A;
            font-size: 1.12rem;
            font-weight: 800;
            margin-bottom: 8px;
            line-height: 1.3;
        }
        .bwise-desc {
            color: #667085;
            font-size: 0.9rem;
            line-height: 1.55;
            margin-bottom: 16px;
            flex-grow: 1;
        }
        .bwise-footer {
            color: #8A93A6;
            font-size: 0.78rem;
            border-top: 1px solid #F1F2F6;
            padding-top: 12px;
            margin-top: auto;
            font-weight: 500;
        }

        /* ── 5. CABEÇALHO (Top Bar) ────────────────────────────────── */
        .bwise-topbar {
            background: #FFFFFF;
            padding: 14px 28px;
            border-radius: 14px;
            margin-bottom: 26px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border: 1px solid #E3E6EC;
        }
        .bwise-topbar-title {
            color: #1B1F2A;
            font-size: 1.3rem;
            font-weight: 800;
            margin: 0;
            text-align: center;
            line-height: 1.25;
            letter-spacing: 0.01em;
        }
        .bwise-topbar-tag {
            display: block;
            color: #00B863;
            font-size: 0.7rem;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            margin-top: 2px;
        }

        .subtitulo {
            color: #1B1F2A;
            font-weight: 700;
            font-size: 1.05rem;
            margin-bottom: 10px;
            display: inline-block;
        }

        /* ── 6. SIDEBAR / NAVEGAÇÃO ────────────────────────────────── */
        section[data-testid="stSidebar"] {
            background-color: #FFFFFF;
            border-right: 1px solid #E3E6EC;
        }
        section[data-testid="stSidebar"] .stButton > button {
            justify-content: flex-start;
            text-align: left;
            border: 1px solid transparent;
            background-color: transparent;
            box-shadow: none;
            margin-bottom: 0.2rem;
            font-weight: 500;
            color: #4B5266;
        }
        section[data-testid="stSidebar"] .stButton > button:hover {
            background-color: #F6F7F9;
            color: #1B1F2A;
            border-color: #E3E6EC;
            transform: none;
        }
        section[data-testid="stSidebar"] .stButton > button[kind="primary"] {
            background-color: #EAFBF2;
            color: #0B2015;
            border-left: 3px solid #00D573;
            border-radius: 8px;
            box-shadow: none;
            font-weight: 700;
        }
        .bwise-sidebar-brand {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
            padding: 6px 4px 18px 4px;
            margin-bottom: 10px;
            border-bottom: 1px solid #F1F2F6;
        }
        .bwise-sidebar-eyebrow {
            color: #8A93A6;
            font-size: 0.68rem;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
        }
        .bwise-sidebar-section {
            color: #8A93A6;
            font-size: 0.72rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin: 4px 0 8px 4px;
        }

        /* ── 7. UPLOAD DE ARQUIVOS ─────────────────────────────────── */
        [data-testid="stFileUploader"] section {
            background-color: #FBFBFC;
            border: 1.5px dashed #C9CEDA;
            border-radius: 10px;
            padding: 0.6rem;
            transition: border-color 0.18s ease;
        }
        [data-testid="stFileUploader"] section:hover {
            border-color: #00D573;
        }
        [data-testid="stFileUploaderFile"] {
            background-color: #FFFFFF;
            border: 1px solid #E3E6EC;
            border-radius: 8px;
        }

        /* ── 8. MENSAGENS (alert boxes) ────────────────────────────── */
        div[data-testid="stAlertContentInfo"],
        div[data-testid="stAlertContentSuccess"],
        div[data-testid="stAlertContentWarning"],
        div[data-testid="stAlertContentError"] {
            font-size: 0.92rem;
        }
        .stAlert {
            border-radius: 10px !important;
            border-width: 1px !important;
            border-style: solid !important;
        }

        /* ── 9. TABELAS ────────────────────────────────────────────── */
        [data-testid="stDataFrame"] {
            border: 1px solid #E3E6EC;
            border-radius: 12px;
            overflow: hidden;
        }

        /* ── 10. MÉTRICAS ──────────────────────────────────────────── */
        [data-testid="stMetric"] {
            background-color: #FFFFFF;
            border: 1px solid #E3E6EC;
            border-radius: 12px;
            padding: 14px 16px;
        }
        [data-testid="stMetricLabel"] { color: #667085; font-weight: 600; }
        [data-testid="stMetricValue"] { color: #1B1F2A; font-weight: 800; }

        /* ── 11. EXPANDERS ─────────────────────────────────────────── */
        [data-testid="stExpander"] {
            border: 1px solid #E3E6EC;
            border-radius: 10px;
            background-color: #FFFFFF;
        }

        /* ── 12. RODAPÉ ────────────────────────────────────────────── */
        .bwise-footer-page {
            text-align: center;
            margin-top: 56px;
            padding-top: 18px;
            border-top: 1px solid #E3E6EC;
            color: #8A93A6;
            font-size: 0.82rem;
            font-weight: 500;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def buscar_logo(palavra_chave: str) -> str | None:
    """Procura um arquivo de imagem (logo) pelo nome, em pastas conhecidas."""
    pastas = ["assets", "."]
    for pasta in pastas:
        try:
            for arq in os.listdir(pasta):
                if arq.lower().endswith((".png", ".jpg", ".jpeg")):
                    if palavra_chave.lower() in arq.lower():
                        return os.path.join(pasta, arq)
        except Exception:
            continue
    return None


def renderizar_cabecalho(titulo_html: str, tag: str = "PAINEL DE CONFERÊNCIA"):
    """Renderiza o cabeçalho institucional (logo Bwise + título + logo do cliente)."""
    injetar_css_global()

    logo_bwise = buscar_logo("bwise")
    logo_macaneiro = buscar_logo("macaneiro")

    st.markdown('<div class="bwise-topbar">', unsafe_allow_html=True)
    col1, col2, col3 = st.columns([1, 3, 1], vertical_alignment="center")

    with col1:
        if logo_bwise:
            st.image(logo_bwise, width=120)
        else:
            st.markdown(
                "<span style='font-weight:800;font-size:1.1rem;color:#232838;'>bwise</span>",
                unsafe_allow_html=True,
            )

    with col2:
        st.markdown(
            f'<h1 class="bwise-topbar-title">{titulo_html}'
            f'<span class="bwise-topbar-tag">{tag}</span></h1>',
            unsafe_allow_html=True,
        )

    with col3:
        if logo_macaneiro:
            _, sub = st.columns([1, 1])
            with sub:
                st.image(logo_macaneiro, width=110)
        else:
            st.markdown(
                "<div style='text-align:right;font-weight:700;color:#8A93A6;'>MAÇANEIRO</div>",
                unsafe_allow_html=True,
            )

    st.markdown('</div>', unsafe_allow_html=True)


def renderizar_navegacao_lateral(pagina_atual: str):
    """Renderiza o menu lateral fixo/recolhível dos módulos do sistema."""
    with st.sidebar:
        logo_bwise = buscar_logo("bwise")
        st.markdown('<div class="bwise-sidebar-brand">', unsafe_allow_html=True)
        if logo_bwise:
            st.image(logo_bwise, width=104)
        st.markdown(
            '<span class="bwise-sidebar-eyebrow">Plataforma de Auditoria</span>',
            unsafe_allow_html=True,
        )
        st.markdown('</div>', unsafe_allow_html=True)

        st.markdown('<div class="bwise-sidebar-section">Módulos</div>', unsafe_allow_html=True)
        for rotulo, caminho, icone in PAGINAS_APP:
            selecionado = rotulo == pagina_atual
            if st.button(
                f"{icone}  {rotulo}",
                key=f"nav_{caminho}",
                type="primary" if selecionado else "secondary",
                disabled=selecionado,
                use_container_width=True,
            ):
                st.switch_page(caminho)

        st.divider()
        st.caption("© 2026 Bwise Analytics")
