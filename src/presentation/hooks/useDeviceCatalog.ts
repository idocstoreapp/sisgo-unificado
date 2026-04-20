"use client";

import { useState, useEffect } from "react";

interface DeviceCatalog {
  deviceTypes: any[];
  brands: any[];
  lines: any[];
  models: any[];
  variants: any[];
}

export function useDeviceCatalog() {
  const [catalog, setCatalog] = useState<DeviceCatalog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const response = await fetch("/api/device-catalog");
        const data = await response.json();
        if (data.success) {
          setCatalog(data);
        }
      } catch (error) {
        console.error("Error loading catalog:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, []);

  return { catalog, loading };
}
