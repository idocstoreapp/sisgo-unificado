/**
 * DTOs for Inventory module
 */

import type { ProductType, ProductUnit } from "@/domain/entities/Product";
import type { MovementDirection, MovementReason, PurchaseStatus } from "@/domain/entities/Inventory";

// ==================== PRODUCT ====================

export interface CreateProductDTO {
  companyId: string;
  name: string;
  description?: string;
  category?: string;
  type: ProductType;
  barcode?: string;
  costPrice: number;
  salePrice: number;
  stock?: number;
  minStock?: number;
  unitType: ProductUnit;
  imageUrl?: string;
}

export interface ProductOutputDTO {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  category?: string;
  type: ProductType;
  barcode?: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  unitType: ProductUnit;
  imageUrl?: string;
  isActive: boolean;
  isLowStock: boolean;
  isOutOfStock: boolean;
  profitMargin: number;
  createdAt: Date;
  updatedAt?: Date;
}

// ==================== STOCK MOVEMENT ====================

export interface CreateStockMovementDTO {
  companyId: string;
  productId: string;
  quantity: number;
  direction: MovementDirection;
  reason: MovementReason;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
  performedBy?: string;
}

export interface StockMovementOutputDTO {
  id: string;
  companyId: string;
  productId: string;
  quantity: number;
  direction: MovementDirection;
  reason: MovementReason;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
  performedBy?: string;
  createdAt: Date;
}

// ==================== SUPPLIER ====================

export interface CreateSupplierDTO {
  companyId: string;
  name: string;
  contactInfo?: string;
  email?: string;
  phone?: string;
  address?: string;
  rut?: string;
}

export interface SupplierOutputDTO {
  id: string;
  companyId: string;
  name: string;
  contactInfo?: string;
  email?: string;
  phone?: string;
  address?: string;
  rut?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// ==================== PURCHASE ====================

export interface PurchaseItemDTO {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface CreatePurchaseDTO {
  companyId: string;
  supplierId: string;
  invoiceNumber?: string;
  invoiceDate?: Date;
  paymentMethod?: string;
  notes?: string;
  items: PurchaseItemDTO[];
}

export interface PurchaseOutputDTO {
  id: string;
  companyId: string;
  supplierId: string;
  invoiceNumber?: string;
  invoiceDate?: Date;
  total: number;
  paymentMethod?: string;
  status: PurchaseStatus;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}
