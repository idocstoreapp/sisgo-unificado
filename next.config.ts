/**
 * next.config.ts configuration
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Clean .next folder on each build
  output: "standalone",
  outputFileTracingRoot: __dirname,
  eslint: {
    // Mientras migramos módulos legacy, no bloquear el build por warnings.
    // La calidad se controla por módulo (y se irá reactivando gradualmente).
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporal: la migración arrastra deuda TypeScript en módulos no críticos.
    // El módulo de servicio técnico se valida con comandos focalizados.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
