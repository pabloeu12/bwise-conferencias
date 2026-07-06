"""
core/ui.py
──────────
Componentes visuais e injeção de CSS Premium (Estilo SaaS).
"""

import os
import streamlit as st

PAGINAS_APP = [
    ("Início", "Inicio.py"),
    ("Auditoria de Rubricas", "pages/1_Auditoria_de_Rubricas.py"),
    ("Adiantamento Salarial", "pages/2_Adiantamento_Salarial.py"),
    ("Conferencia de Férias", "pages/3_Conferencia_de_Ferias.py"),
    ("Conferencia de Consignados", "pages/4_Conferencia_de_Consignados.py"),
]

def injetar_css_global():
    """Injeta estilos avançados para transformar o Streamlit em um SaaS moderno."""
    st.markdown(
        """
        <style>
        /* 1. Esconder elementos padrões do Streamlit sem remover o controle da sidebar */
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        [data-testid="stToolbar"] {visibility: hidden;}

        /* 2. Fundo geral e ajustes de espaçamento */
        .stApp {
            background-color: #F8FAFC;
        }
        .block-container {
            padding-top: 2rem !important;
            padding-bottom: 2rem !important;
            max-width: 1200px;
        }

        /* 3. Botões Premium */
        .stButton > button {
            width: 100%;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.3s ease;
            border: none;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .stButton > button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        .stButton > button[kind="primary"] {
            background-color: #1E3A8A;
            color: white;
        }

        /* 4. Cards Executivos (Dashboard) */
        .saas-card {
            background: #FFFFFF;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
            border: 1px solid #E2E8F0;
            transition: all 0.3s ease;
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        .saas-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 20px -3px rgba(0,0,0,0.1);
            border-color: #1E3A8A;
        }
        .saas-badge {
            background-color: #EFF6FF;
            color: #1D4ED8;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.05em;
            display: inline-block;
            margin-bottom: 16px;
            width: max-content;
        }
        .saas-title {
            color: #0F172A;
            font-size: 1.25rem;
            font-weight: 800;
            margin-bottom: 12px;
            line-height: 1.3;
        }
        .saas-desc {
            color: #64748B;
            font-size: 0.95rem;
            line-height: 1.6;
            margin-bottom: 20px;
            flex-grow: 1;
        }
        .saas-footer {
            color: #94A3B8;
            font-size: 0.85rem;
            border-top: 1px solid #F1F5F9;
            padding-top: 16px;
            margin-top: auto;
            font-weight: 500;
        }

        /* 5. Cabeçalho Moderno (Top Bar) */
        .top-bar {
            background: white;
            padding: 16px 32px;
            border-radius: 12px;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border: 1px solid #E2E8F0;
        }
        .top-bar-title {
            color: #1E3A8A;
            font-size: 1.4rem;
            font-weight: 800;
            margin: 0;
            text-align: center;
            line-height: 1.2;
        }
        
        /* Subtítulos padronizados para as páginas */
        .subtitulo {
            color: #0F172A;
            font-weight: 700;
            font-size: 1.1rem;
            margin-bottom: 10px;
        }

        /* 6. Navegação lateral unificada */
        section[data-testid="stSidebar"] {
            background-color: #FFFFFF;
            border-right: 1px solid #E2E8F0;
        }
        section[data-testid="stSidebar"] .stButton > button {
            justify-content: flex-start;
            text-align: left;
            box-shadow: none;
            margin-bottom: 0.25rem;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )

def buscar_logo(palavra_chave: str) -> str | None:
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

def renderizar_cabecalho(titulo_html: str):
    """Renderiza um cabeçalho estilo "Top Bar" em formato de cartão isolado."""
    injetar_css_global()

    logo_bwise = buscar_logo("bwise")
    logo_macaneiro = buscar_logo("macaneiro")

    # Estrutura HTML do cabeçalho
    st.markdown('<div class="top-bar">', unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 3, 1], vertical_alignment="center")

    with col1:
        if logo_bwise:
            st.image(logo_bwise, width=140)
        else:
            st.markdown("<b>BWISE</b>", unsafe_allow_html=True)

    with col2:
        st.markdown(
            f'<h1 class="top-bar-title">{titulo_html}</h1>',
            unsafe_allow_html=True,
        )

    with col3:
        if logo_macaneiro:
            _, sub = st.columns([1, 1])
            with sub:
                st.image(logo_macaneiro, width=140)
        else:
            st.markdown("<b>MAÇANEIRO</b>", unsafe_allow_html=True)
            
    st.markdown('</div>', unsafe_allow_html=True)

def renderizar_navegacao_lateral(pagina_atual: str):
    """Renderiza o menu lateral fixo dos módulos."""
    with st.sidebar:
        st.markdown("### Módulos")
        for rotulo, caminho in PAGINAS_APP:
            selecionado = rotulo == pagina_atual
            if st.button(
                rotulo,
                key=f"nav_{caminho}",
                type="primary" if selecionado else "secondary",
                disabled=selecionado,
                use_container_width=True,
            ):
                st.switch_page(caminho)
        st.divider()
