# Frontend — Plataforma de Conferências Bwise (Next.js)

Interface web da plataforma de conferência de folha de pagamento. Consome o
backend FastAPI que está em `../app.py` (raiz do repositório).

Ver o `README.md` da raiz do repositório para o mapa completo do projeto.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Por padrão, as chamadas
de API vão para `http://127.0.0.1:8000` — suba o backend com
`uvicorn app:app --reload --port 8000` a partir da raiz do repositório.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` se precisar apontar para um backend
publicado (produção). Veja `../DEPLOY.md` para o passo a passo completo de
publicação (Render + Vercel).

## Estrutura

```
frontend/
├── app/
│   ├── page.tsx              ← painel inicial
│   ├── rubricas/page.tsx      ← módulo de Auditoria de Rubricas
│   ├── adiantamento/page.tsx  ← módulo de Adiantamento Salarial
│   ├── ferias/page.tsx        ← módulo de Conferência de Férias
│   ├── consignados/page.tsx   ← módulo de Conferência de Consignados
│   ├── components/            ← Sidebar, Topbar, DataTable, MetricsRow, PassoAPasso
│   └── globals.css            ← paleta de cores e tema Bwise
├── lib/api.ts                 ← URL do backend (NEXT_PUBLIC_API_URL)
└── public/                    ← logos e imagens
```
