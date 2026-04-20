/**
 * DTOs for Quote module
 */

import type { QuoteStatus } from "@/domain/entities/Quote";

// ==================== CREATE QUOTE ====================

export interface CreateQuoteItemDTO {
  itemType: "material" | "servicio" | "mueble";
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  metadata?: Record<string, unknown>;
}

export interface CreateQuoteDTO {
  companyId: string;
  branchId?: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  profitMargin?: number;
  ivaPercentage?: number;
  notes?: string;
  terms?: string;
  validUntil?: Date;
  items: CreateQuoteItemDTO[];
}

export interface QuoteOutputDTO {
  id: string;
  companyId: string;
  branchId?: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  quoteNumber: string;
  status: QuoteStatus;
  items: Array<{
    id: string;
    itemType: "material" | "servicio" | "mueble";
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  ivaPercentage: number;
  ivaAmount: number;
  profitMargin: number;
  profitAmount: number;
  total: number;
  notes?: string;
  terms?: string;
  validUntil?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

// ==================== UPDATE QUOTE ====================

export interface UpdateQuoteDTO {
  id: string;
  companyId: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  profitMargin?: number;
  ivaPercentage?: number;
  notes?: string;
  terms?: string;
  validUntil?: Date;
  items?: CreateQuoteItemDTO[];
}

// ==================== QUOTE FILTERS ====================

export interface QuoteFiltersDTO {
  status?: QuoteStatus;
  customerId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// ==================== MATERIAL ====================

export interface CreateMaterialDTO {
  companyId: string;
  name: string;
  description?: string;
  category?: string;
  unitType: "un" | "kg" | "gr" | "lt" | "ml" | "m2" | "m3" | "ml";
  costPrice: number;
  salePrice: number;
  currentStock?: number;
  minStock?: number;
  supplierId?: string;
  imageUrl?: string;
}

export interface MaterialOutputDTO {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  category?: string;
  unitType: string;
  costPrice: number;
  salePrice: number;
  currentStock: number;
  minStock: number;
  supplierId?: string;
  imageUrl?: string;
  isActive: boolean;
  isLowStock: boolean;
  profitMargin: number;
  createdAt: Date;
  updatedAt?: Date;
}

// ==================== SERVICE ====================

export interface CreateServiceDTO {
  companyId: string;
  name: string;
  description?: string;
  category?: string;
  pricePerHour: number;
  estimatedHours?: number;
  imageUrl?: string;
}

export interface ServiceOutputDTO {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  category?: string;
  pricePerHour: number;
  estimatedHours?: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// ==================== FURNITURE CATALOG ====================

export interface FurnitureVariantDTO {
  name: string;
  dimensions?: string;
  color?: string;
  material?: string;
  additionalCost: number;
}

export interface CreateFurnitureDTO {
  companyId: string;
  name: string;
  description?: string;
  category?: string;
  basePrice: number;
  baseMaterialsCost: number;
  baseLaborHours: number;
  imageUrl?: string;
  variants?: FurnitureVariantDTO[];
}

export interface FurnitureOutputDTO {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  category?: string;
  basePrice: number;
  baseMaterialsCost: number;
  baseLaborHours: number;
  imageUrl?: string;
  variants: Array<{
    id: string;
    name: string;
    dimensions?: string;
    color?: string;
    material?: string;
    additionalCost: number;
    isActive: boolean;
  }>;
  isActive: boolean;
  profitMargin: number;
  createdAt: Date;
  updatedAt?: Date;
}
