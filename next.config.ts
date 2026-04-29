/**
 * next.config.ts configuration
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Clean .next folder on each build
  output: "standalone",
  eslint: {
    // Mientras migramos módulos legacy, no bloquear el build por warnings.
    // La calidad se controla por módulo (y se irá reactivando gradualmente).
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Optimize package imports
    optimizePackageImports: ["lucide-react", "@radix-ui/react-dialog", "recharts"],
  },
};

export default nextConfig;
