/**
 * URL base do backend (Motor Bwise / FastAPI).
 *
 * Em desenvolvimento local cai para http://127.0.0.1:8000 automaticamente.
 * Em produção, defina NEXT_PUBLIC_API_URL (ex: no painel do Vercel) apontando
 * para a URL pública do backend hospedado (ex: no Render).
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
