# Plataforma de Conferências — Bwise & Maçaneiro

Sistema unificado de conferência de folha de pagamento com três módulos integrados.

## Módulos

| # | Nome | Função |
|---|------|--------|
| 1 | 📋 Conferência de Rubricas | Cruzamento de lançamentos x sistema KMM |
| 2 | 💰 Conferência de Adiantamento | Comparação de adiantamentos entre meses |
| 3 | 🏖️ Conferência de Férias | Verificação de recibo de férias individual |

## Estrutura do Projeto

```
bwise-conferencias/
├── 🏠_Inicio.py          ← Página inicial (dashboard)
├── pages/
│   ├── 1_📋_Rubricas.py
│   ├── 2_💰_Adiantamento.py
│   └── 3_🏖️_Ferias.py
├── core/
│   ├── ui.py             ← Cabeçalho, logos, CSS global
│   └── utils.py          ← Funções utilitárias compartilhadas
├── assets/
│   ├── logo_bwise.png
│   └── logo_macaneiro.jpg
└── requirements.txt
```

## Como executar localmente

```bash
# 1. Instalar dependências
pip install -r requirements.txt

# 2. Copiar logos para a pasta assets/
#    (logo bwise.png e logo macaneiro.jpg)

# 3. Executar
streamlit run 🏠_Inicio.py
```

## Deploy no Streamlit Cloud

1. Subir este repositório no GitHub
2. Acessar share.streamlit.io e apontar para `🏠_Inicio.py`
3. Copiar as logos para `assets/` antes do push
