/**
 * DTOs para órdenes de trabajo
 */

import type { OrderStatus, Priority, PaymentMethod } from "@/shared/kernel/types";

/**
 * DTO para crear una orden de trabajo
 */
export interface CreateOrderDTO {
  companyId: string;
  branchId?: string;
  customerId: string;
  assignedTo?: string;
  createdBy?: string;
  businessType: string;
  priority?: Priority;
  commitmentDate?: Date;
  warrantyDays?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
  services?: OrderServiceDTO[];
  replacementCost?: number;
  laborCost?: number;
  totalPrice?: number;
}

/**
 * DTO para un servicio dentro de una orden
 */
export interface OrderServiceDTO {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
}

/**
 * DTO para actualizar una orden
 */
export interface UpdateOrderDTO {
  status?: OrderStatus;
  priority?: Priority;
  assignedTo?: string;
  commitmentDate?: Date;
  notes?: string;
  metadata?: Record<string, unknown>;
  replacementCost?: number;
  laborCost?: number;
  totalPrice?: number;
  paymentMethod?: PaymentMethod;
  receiptNumber?: string;
}

/**
 * DTO de salida para una orden
 */
export interface OrderOutputDTO {
  id: string;
  companyId: string;
  branchId: string | null;
  customerId: string;
  assignedTo: string | null;
  createdBy: string | null;
  orderNumber: string;
  businessType: string;
  metadata: Record<string, unknown>;
  status: OrderStatus;
  priority: Priority;
  commitmentDate: Date | null;
  deliveredAt: Date | null;
  replacementCost: number;
  laborCost: number;
  totalCost: number;
  totalPrice: number;
  paymentMethod: string | null;
  receiptNumber: string | null;
  paidAt: Date | null;
  warrantyDays: number;
  warrantyExpiresAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  isCompleted: boolean;
  isInWarranty: boolean;
  isOverdue: boolean;
  isPaid: boolean;
}

/**
 * DTO de resumen para listas de órdenes
 */
export interface OrderSummaryDTO {
  id: string;
  orderNumber: string;
  customerName: string;
  businessType: string;
  status: OrderStatus;
  priority: Priority;
  totalPrice: number;
  commitmentDate: Date | null;
  createdAt: Date;
  isOverdue: boolean;
  isPaid: boolean;
}
