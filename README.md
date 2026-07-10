# Plataforma de Conferências — Bwise & Maçaneiro

Sistema de conferência de folha de pagamento com quatro módulos:

| # | Módulo | Função |
|---|--------|--------|
| 1 | Auditoria de Rubricas | Cruzamento de lançamentos x sistema KMM |
| 2 | Adiantamento Salarial | Comparação de adiantamentos entre meses |
| 3 | Conferência de Férias | Verificação de recibo de férias individual |
| 4 | Conferência de Consignados | Emprega Brasil x folha e limite de 35% |

## ⚠️ Este repositório tem DUAS interfaces (front-ends)

Elas fazem exatamente a mesma coisa — a lógica de cálculo (pasta `services/`) é
100% compartilhada entre as duas. A diferença é só a tela.

| | Streamlit (original) | Next.js + FastAPI (atual) |
|---|---|---|
| **Pasta** | `Inicio.py`, `pages/`, `core/` | `frontend/` (tela) + `app.py` (backend) |
| **Hospedado em** | não hospedado publicamente hoje | Vercel (tela) + Render (backend) |
| **Rodar local** | `streamlit run Inicio.py` | ver passo a passo abaixo |
| **Situação** | mantido em paralelo, funcionando | versão em uso ativo, com a identidade visual da Bwise |

Se algum dia decidir usar só uma das duas, me avise para eu remover a outra
com segurança (hoje as duas continuam ativas por decisão sua).

## Estrutura do projeto

```
bwise-conferencias/
├── Inicio.py                  ← tela inicial do Streamlit
├── pages/                     ← telas do Streamlit (1 arquivo por módulo)
├── core/                      ← visual e utilitários do Streamlit
├── app.py                     ← backend FastAPI usado pelo frontend/
├── services/                  ← lógica de cálculo, USADA PELOS DOIS sistemas
├── assets/                    ← logos usadas pelo Streamlit
├── tests/                     ← testes automatizados (Python)
├── frontend/                  ← site em Next.js (Vercel)
│   ├── app/                   ← páginas e componentes
│   └── lib/api.ts             ← URL do backend
├── requirements.txt           ← dependências Python (Streamlit + FastAPI)
└── DEPLOY.md                  ← passo a passo de publicação (Render + Vercel)
```

## Como rodar localmente

### Opção A — Streamlit (versão original)

```bash
pip install -r requirements.txt
streamlit run Inicio.py
```

### Opção B — Next.js + FastAPI (versão atual)

```bash
# Terminal 1 — backend
pip install -r requirements.txt
uvicorn app:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:3000`. Veja `DEPLOY.md` para publicar de graça
(Render + Vercel).

## Testes automatizados

```bash
python -m unittest tests.test_comparador -v
```
