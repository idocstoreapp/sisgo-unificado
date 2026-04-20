/**
 * useQuotes hook - provides quote-related actions
 */

"use client";

import { useState, useCallback } from "react";
import {
  createQuoteUseCase,
  updateQuoteUseCase,
  changeQuoteStatusUseCase,
  createMaterialUseCase,
  createServiceUseCase,
  createFurnitureCatalogUseCase,
} from "@/application/di-container";
import type {
  CreateQuoteDTO,
  UpdateQuoteDTO,
  CreateMaterialDTO,
  CreateServiceDTO,
  CreateFurnitureDTO,
} from "@/application/dtos/QuoteDTOs";
import type { QuoteStatus } from "@/domain/entities/Quote";

interface UseQuotesReturn {
  isLoading: boolean;
  error: string | null;
  createQuote: (data: CreateQuoteDTO) => Promise<{ success: boolean; quoteId?: string; error?: string }>;
  updateQuote: (data: UpdateQuoteDTO) => Promise<{ success: boolean; error?: string }>;
  changeQuoteStatus: (quoteId: string, status: QuoteStatus) => Promise<{ success: boolean; error?: string }>;
  createMaterial: (data: CreateMaterialDTO) => Promise<{ success: boolean; materialId?: string; error?: string }>;
  createService: (data: CreateServiceDTO) => Promise<{ success: boolean; serviceId?: string; error?: string }>;
  createFurniture: (data: CreateFurnitureDTO) => Promise<{ success: boolean; furnitureId?: string; error?: string }>;
}

export function useQuotes(): UseQuotesReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createQuote = useCallback(async (data: CreateQuoteDTO) => {
    setIsLoading(true);
    setError(null);

    const result = await createQuoteUseCase.execute(data);

    if (result.isFailure) {
      const errorMessage = result.error?.message ?? "Error al crear cotización";
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }

    const quote = result.getValue();
    setIsLoading(false);
    return { success: true, quoteId: quote.id };
  }, []);

  const updateQuote = useCallback(async (data: UpdateQuoteDTO) => {
    setIsLoading(true);
    setError(null);

    const result = await updateQuoteUseCase.execute(data);

    if (result.isFailure) {
      const errorMessage = result.error?.message ?? "Error al actualizar cotización";
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }

    setIsLoading(false);
    return { success: true };
  }, []);

  const changeQuoteStatus = useCallback(async (quoteId: string, status: QuoteStatus) => {
    setIsLoading(true);
    setError(null);

    const result = await changeQuoteStatusUseCase.execute(quoteId, status);

    if (result.isFailure) {
      const errorMessage = result.error?.message ?? "Error al cambiar estado";
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }

    setIsLoading(false);
    return { success: true };
  }, []);

  const createMaterial = useCallback(async (data: CreateMaterialDTO) => {
    setIsLoading(true);
    setError(null);

    const result = await createMaterialUseCase.execute(data);

    if (result.isFailure) {
      const errorMessage = result.error?.message ?? "Error al crear material";
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }

    const material = result.getValue();
    setIsLoading(false);
    return { success: true, materialId: material.id };
  }, []);

  const createService = useCallback(async (data: CreateServiceDTO) => {
    setIsLoading(true);
    setError(null);

    const result = await createServiceUseCase.execute(data);

    if (result.isFailure) {
      const errorMessage = result.error?.message ?? "Error al crear servicio";
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }

    const service = result.getValue();
    setIsLoading(false);
    return { success: true, serviceId: service.id };
  }, []);

  const createFurniture = useCallback(async (data: CreateFurnitureDTO) => {
    setIsLoading(true);
    setError(null);

    const result = await createFurnitureCatalogUseCase.execute(data);

    if (result.isFailure) {
      const errorMessage = result.error?.message ?? "Error al crear mueble";
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }

    const furniture = result.getValue();
    setIsLoading(false);
    return { success: true, furnitureId: furniture.id };
  }, []);

  return {
    isLoading,
    error,
    createQuote,
    updateQuote,
    changeQuoteStatus,
    createMaterial,
    createService,
    createFurniture,
  };
}
