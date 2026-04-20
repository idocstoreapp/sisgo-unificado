/**
 * useFinance hook - provides finance-related actions
 */

"use client";

import { useState, useCallback } from "react";
import { processPaymentUseCase, recordExpenseUseCase, savingsFundUseCase, createSalaryAdjustmentUseCase, getFinanceSummaryUseCase } from "@/application/di-container";
import type { CreateEmployeePaymentDTO, CreateExpenseDTO, CreateSavingsFundDTO, CreateSalaryAdjustmentDTO } from "@/application/dtos/FinanceDTOs";
import type { PaymentStatus, AdjustmentType } from "@/domain/entities/EmployeePayment";

interface UseFinanceReturn {
  isLoading: boolean;
  error: string | null;
  processPayment: (data: CreateEmployeePaymentDTO) => Promise<{ success: boolean; error?: string }>;
  recordExpense: (data: CreateExpenseDTO) => Promise<{ success: boolean; error?: string }>;
  savingsFundAction: (data: CreateSavingsFundDTO) => Promise<{ success: boolean; error?: string }>;
  createAdjustment: (data: CreateSalaryAdjustmentDTO) => Promise<{ success: boolean; error?: string }>;
}

export function useFinance(): UseFinanceReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = useCallback(async (data: CreateEmployeePaymentDTO) => {
    setIsLoading(true);
    setError(null);
    const result = await processPaymentUseCase.execute(data);
    if (result.isFailure) { setError(result.error?.message ?? "Error"); setIsLoading(false); return { success: false, error: result.error?.message }; }
    setIsLoading(false);
    return { success: true };
  }, []);

  const recordExpense = useCallback(async (data: CreateExpenseDTO) => {
    setIsLoading(true);
    setError(null);
    const result = await recordExpenseUseCase.execute(data);
    if (result.isFailure) { setError(result.error?.message ?? "Error"); setIsLoading(false); return { success: false, error: result.error?.message }; }
    setIsLoading(false);
    return { success: true };
  }, []);

  const savingsFundAction = useCallback(async (data: CreateSavingsFundDTO) => {
    setIsLoading(true);
    setError(null);
    const result = await savingsFundUseCase.execute(data);
    if (result.isFailure) { setError(result.error?.message ?? "Error"); setIsLoading(false); return { success: false, error: result.error?.message }; }
    setIsLoading(false);
    return { success: true };
  }, []);

  const createAdjustment = useCallback(async (data: CreateSalaryAdjustmentDTO) => {
    setIsLoading(true);
    setError(null);
    const result = await createSalaryAdjustmentUseCase.execute(data);
    if (result.isFailure) { setError(result.error?.message ?? "Error"); setIsLoading(false); return { success: false, error: result.error?.message }; }
    setIsLoading(false);
    return { success: true };
  }, []);

  return { isLoading, error, processPayment, recordExpense, savingsFundAction, createAdjustment };
}
