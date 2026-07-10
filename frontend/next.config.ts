import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Declara explicitamente a raiz do projeto Next.js como esta pasta
  // (frontend/), evitando que o Next confunda com o package-lock.json
  // que existe na raiz do repositório (usado só pelo script de
  // conveniência "npm run dev" da raiz).
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
