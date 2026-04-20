/**
 * useOrders hook - provides order-related actions
 */

"use client";

import { useState, useCallback } from "react";
import { createOrderUseCase, updateOrderStatusUseCase } from "@/application/di-container";
import type { CreateOrderDTO } from "@/application/dtos/OrderDTOs";
import type { OrderStatus } from "@/shared/kernel/types";

interface UseOrdersReturn {
  isLoading: boolean;
  error: string | null;
  createOrder: (data: CreateOrderDTO) => Promise<{ success: boolean; orderId?: string; error?: string }>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<{ success: boolean; error?: string }>;
}

export function useOrders(): UseOrdersReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = useCallback(async (data: CreateOrderDTO) => {
    setIsLoading(true);
    setError(null);

    const result = await createOrderUseCase.execute(data);

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

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    setIsLoading(true);
    setError(null);

    const result = await updateOrderStatusUseCase.execute(orderId, status);

    if (result.isFailure) {
      const errorMessage = result.error?.message ?? "Error al actualizar estado";
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
    createOrder,
    updateOrderStatus,
  };
}
