# Guia de Deploy — Plataforma Bwise (Next.js + FastAPI)

Este projeto tem duas partes que precisam ser hospedadas separadamente, as duas gratuitamente:

- **Backend** (`app.py` + `services/`) → Python/FastAPI → hospedar no **Render**.
- **Frontend** (`frontend/`) → Next.js → hospedar no **Vercel**.

## 1. Backend no Render

1. Acesse [render.com](https://render.com) e crie uma conta gratuita (não pede cartão de crédito).
2. **New +** → **Web Service** → conecte a sua conta do GitHub e escolha este repositório.
3. Configure:
   - **Root Directory**: deixe em branco (usa a raiz do repositório).
   - **Runtime**: Python 3.
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
4. Em **Environment Variables**, adicione (depois de publicar o frontend no passo 2, volte aqui e complete):
   - `FRONTEND_ORIGINS` = `https://SEU-APP.vercel.app` (a URL que o Vercel vai te dar). Se quiser permitir mais de uma URL (ex: produção + preview), separe por vírgula: `https://seu-app.vercel.app,https://seu-app-git-main.vercel.app`.
5. Clique em **Create Web Service**. Ao final, o Render te dá uma URL pública, algo como `https://motor-bwise.onrender.com` — guarde essa URL, você vai usar no passo 2.

> Nota: no plano gratuito do Render, o serviço "dorme" depois de um tempo sem uso e demora alguns segundos para acordar na primeira requisição depois disso. É normal.

## 2. Frontend no Vercel

1. Acesse [vercel.com](https://vercel.com) e crie uma conta gratuita com o GitHub.
2. **Add New** → **Project** → escolha este mesmo repositório.
3. Em **Root Directory**, clique em "Edit" e selecione a pasta **`frontend`** (não a raiz do repositório).
4. O Vercel detecta automaticamente que é um projeto Next.js — não precisa mudar build/start command.
5. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_API_URL` = a URL do backend que o Render te deu no passo 1 (ex: `https://motor-bwise.onrender.com`).
6. Clique em **Deploy**. Ao final, o Vercel te dá a URL pública do site (ex: `https://bwise-conferencias.vercel.app`).
7. **Volte ao Render** (passo 1.4) e complete a variável `FRONTEND_ORIGINS` com essa URL do Vercel, depois clique em "Manual Deploy" → "Deploy latest commit" para aplicar.

## 3. Testando

Abra a URL do Vercel, navegue pelos módulos, suba arquivos de teste e confirme que o download da planilha funciona. Se aparecer erro de conexão, confira:
- Se a variável `NEXT_PUBLIC_API_URL` no Vercel está exatamente igual à URL do Render (sem barra `/` no final).
- Se a variável `FRONTEND_ORIGINS` no Render inclui a URL exata do Vercel (sem barra `/` no final).

## Desenvolvimento local (sem hospedagem)

Não precisa de nenhuma variável de ambiente — os padrões já apontam para `localhost`.

```bash
# Terminal 1 — backend
uvicorn app:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

Acesse http://localhost:3000.
