/**
 * useInventory hook - provides inventory-related actions
 */

"use client";

import { useState, useCallback } from "react";
import {
  createProductUseCase,
  updateStockUseCase,
  createSupplierUseCase,
  createPurchaseUseCase,
} from "@/application/di-container";
import type {
  CreateProductDTO,
  CreateStockMovementDTO,
  CreateSupplierDTO,
  CreatePurchaseDTO,
} from "@/application/dtos/InventoryDTOs";

interface UseInventoryReturn {
  isLoading: boolean;
  error: string | null;
  createProduct: (data: CreateProductDTO) => Promise<{ success: boolean; productId?: string; error?: string }>;
  updateStock: (data: CreateStockMovementDTO) => Promise<{ success: boolean; error?: string }>;
  createSupplier: (data: CreateSupplierDTO) => Promise<{ success: boolean; supplierId?: string; error?: string }>;
  createPurchase: (data: CreatePurchaseDTO) => Promise<{ success: boolean; purchaseId?: string; error?: string }>;
}

export function useInventory(): UseInventoryReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProduct = useCallback(async (data: CreateProductDTO) => {
    setIsLoading(true);
    setError(null);

    const result = await createProductUseCase.execute(data);

    if (result.isFailure) {
      const errorMessage = result.error?.message ?? "Error al crear producto";
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }

    const product = result.getValue();
    setIsLoading(false);
    return { success: true, productId: product.id };
  }, []);

  const updateStock = useCallback(async (data: CreateStockMovementDTO) => {
    setIsLoading(true);
    setError(null);

    const result = await updateStockUseCase.execute(data);

    if (result.isFailure) {
      const errorMessage = result.error?.message ?? "Error al actualizar stock";
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }

    setIsLoading(false);
    return { success: true };
  }, []);

  const createSupplier = useCallback(async (data: CreateSupplierDTO) => {
    setIsLoading(true);
    setError(null);

    const result = await createSupplierUseCase.execute(data);

    if (result.isFailure) {
      const errorMessage = result.error?.message ?? "Error al crear proveedor";
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }

    const supplier = result.getValue();
    setIsLoading(false);
    return { success: true, supplierId: supplier.id };
  }, []);

  const createPurchase = useCallback(async (data: CreatePurchaseDTO) => {
    setIsLoading(true);
    setError(null);

    const result = await createPurchaseUseCase.execute(data);

    if (result.isFailure) {
      const errorMessage = result.error?.message ?? "Error al crear compra";
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }

    const purchase = result.getValue();
    setIsLoading(false);
    return { success: true, purchaseId: purchase.id };
  }, []);

  return {
    isLoading,
    error,
    createProduct,
    updateStock,
    createSupplier,
    createPurchase,
  };
}
