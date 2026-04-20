/**
 * useRestaurant hook
 */

"use client";

import { useState, useCallback } from "react";
import {
  createTableUseCase,
  createMenuItemUseCase,
  createRestaurantOrderUseCase,
  updateIngredientStockUseCase,
  createRecipeUseCase,
} from "@/application/di-container";
import type { CreateTableDTO, CreateMenuItemDTO, CreateRestaurantOrderDTO, CreateIngredientDTO, CreateRecipeDTO } from "@/application/use-cases/RestaurantUseCases";
import type { TableStatus, OrderStatus } from "@/domain/entities/Restaurant";

interface UseRestaurantReturn {
  isLoading: boolean;
  error: string | null;
  createTable: (data: CreateTableDTO) => Promise<{ success: boolean; tableId?: string; error?: string }>;
  createMenuItem: (data: CreateMenuItemDTO) => Promise<{ success: boolean; itemId?: string; error?: string }>;
  createOrder: (data: CreateRestaurantOrderDTO) => Promise<{ success: boolean; orderId?: string; error?: string }>;
  updateIngredientStock: (ingredientId: string, quantity: number, direction: "IN" | "OUT") => Promise<{ success: boolean; error?: string }>;
  createRecipe: (data: CreateRecipeDTO) => Promise<{ success: boolean; recipeId?: string; error?: string }>;
  changeTableStatus: (tableId: string, status: TableStatus) => Promise<{ success: boolean; error?: string }>;
  changeOrderStatus: (orderId: string, status: OrderStatus) => Promise<{ success: boolean; error?: string }>;
}

export function useRestaurant(): UseRestaurantReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTable = useCallback(async (data: CreateTableDTO) => {
    setIsLoading(true);
    setError(null);
    const result = await createTableUseCase.execute(data);
    if (result.isFailure) {
      const errorMessage = result.error?.message ?? "Error al crear mesa";
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
    const table = result.getValue();
    setIsLoading(false);
    return { success: true, tableId: table.id };
  }, []);

  const createMenuItem = useCallback(async (data: CreateMenuItemDTO) => {
    setIsLoading(true);
    setError(null);
    const result = await createMenuItemUseCase.execute(data);
    if (result.isFailure) {
      const errorMessage = result.error?.message ?? "Error al crear item del menú";
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
    const item = result.getValue();
    setIsLoading(false);
    return { success: true, itemId: item.id };
  }, []);

  const createOrder = useCallback(async (data: CreateRestaurantOrderDTO) => {
    setIsLoading(true);
    setError(null);
    const result = await createRestaurantOrderUseCase.execute(data);
    if (result.isFailure) {
      const errorMessage = result.error?.message ?? "Error al crear orden";
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
    const order = result.getValue();
    setIsLoading(false);
    return { success: true, orderId: order.id };
  }, []);

  const updateIngredientStock = useCallback(async (ingredientId: string, quantity: number, direction: "IN" | "OUT") => {
    setIsLoading(true);
    setError(null);
    const result = await updateIngredientStockUseCase.execute(ingredientId, quantity, direction);
    if (result.isFailure) {
      const errorMessage = result.error?.message ?? "Error al actualizar stock";
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
    setIsLoading(false);
    return { success: true };
  }, []);

  const createRecipe = useCallback(async (data: CreateRecipeDTO) => {
    setIsLoading(true);
    setError(null);
    const result = await createRecipeUseCase.execute(data);
    if (result.isFailure) {
      const errorMessage = result.error?.message ?? "Error al crear receta";
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
    const recipe = result.getValue();
    setIsLoading(false);
    return { success: true, recipeId: recipe.id };
  }, []);

  const changeTableStatus = useCallback(async (_tableId: string, _status: TableStatus) => {
    // TODO: Implement table status change use case
    setIsLoading(false);
    return { success: true };
  }, []);

  const changeOrderStatus = useCallback(async (_orderId: string, _status: OrderStatus) => {
    // TODO: Implement order status change use case
    setIsLoading(false);
    return { success: true };
  }, []);

  return {
    isLoading,
    error,
    createTable,
    createMenuItem,
    createOrder,
    updateIngredientStock,
    createRecipe,
    changeTableStatus,
    changeOrderStatus,
  };
}
