/**
 * Main providers wrapper - combines all providers
 */

"use client";

import { ReactQueryProvider } from "./ReactQueryProvider";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ReactQueryProvider>
      {children}
    </ReactQueryProvider>
  );
}
