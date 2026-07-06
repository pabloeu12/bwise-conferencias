# Plataforma de Conferências — Bwise & Maçaneiro

Sistema unificado de conferência de folha de pagamento com quatro módulos integrados.

## Módulos

| # | Nome | Função |
|---|------|--------|
| 1 | 📋 Auditoria de Rubricas | Cruzamento de lançamentos x sistema KMM |
| 2 | 💰 Adiantamento Salarial | Comparação de adiantamentos entre meses |
| 3 | 🏖️ Conferencia de Férias | Verificação de recibo de férias individual |
| 4 | 💳 Conferencia de Consignados | Conferência de Emprega Brasil x folha e limite de 35% |

## Estrutura do Projeto

```
bwise-conferencias/
├── Inicio.py             ← Página inicial (dashboard)
├── pages/
│   ├── 1_Auditoria_de_Rubricas.py
│   ├── 2_Adiantamento_Salarial.py
│   ├── 3_Conferencia_de_Ferias.py
│   └── 4_Conferencia_de_Consignados.py
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
streamlit run Inicio.py
```

## Deploy no Streamlit Cloud

1. Subir este repositório no GitHub
2. Acessar share.streamlit.io e apontar para `Inicio.py`
3. Copiar as logos para `assets/` antes do push
