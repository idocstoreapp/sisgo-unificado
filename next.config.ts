/**
 * next.config.ts configuration
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Clean .next folder on each build
  output: "standalone",
  experimental: {
    // Optimize package imports
    optimizePackageImports: ["lucide-react", "@radix-ui/react-dialog", "recharts"],
  },
};

export default nextConfig;
