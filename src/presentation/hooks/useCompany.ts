/**
 * useCompany hook - provides company data and actions
 */

"use client";

import { useState, useCallback } from "react";
import { registerCompanyUseCase, createBranchUseCase } from "@/application/di-container";
import type { CreateCompanyDTO, CreateBranchDTO, BranchOutputDTO } from "@/application/dtos/CreateCompanyDTO";

interface UseCompanyReturn {
  isLoading: boolean;
  error: string | null;
  registerCompany: (userId: string, userEmail: string, data: CreateCompanyDTO) => Promise<{ success: boolean; error?: string; mainBranch?: BranchOutputDTO }>;
  createBranch: (data: CreateBranchDTO) => Promise<{ success: boolean; error?: string }>;
}

export function useCompany(): UseCompanyReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerCompany = useCallback(
    async (userId: string, userEmail: string, data: CreateCompanyDTO) => {
      setIsLoading(true);
      setError(null);

      const result = await registerCompanyUseCase.execute(userId, userEmail, data);

      if (result.isFailure) {
        const errorMessage = result.error?.message ?? "Error al registrar empresa";
        setError(errorMessage);
        setIsLoading(false);
        return { success: false, error: errorMessage };
      }

      const value = result.getValue();
      setIsLoading(false);
      return { success: true, mainBranch: value.mainBranch };
    },
    []
  );

  const createBranch = useCallback(async (data: CreateBranchDTO) => {
    setIsLoading(true);
    setError(null);

    const result = await createBranchUseCase.execute(data);

    if (result.isFailure) {
      const errorMessage = result.error?.message ?? "Error al crear sucursal";
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }

    setIsLoading(false);
    return { success: true };
  }, []);

  return {
    isLoading,
    error,
    registerCompany,
    createBranch,
  };
}
