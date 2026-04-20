/**
 * Stock Movement repository interface
 */

import { Result } from "@/shared/kernel";
import type { StockMovement, MovementReason } from "@/entities/Inventory";
import type { RepositoryError } from "@/shared/kernel/errors";

export interface StockMovementFilters {
  productId?: string;
  reason?: MovementReason;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface IStockMovementRepository {
  /** Find stock movement by ID */
  findById(id: string): Promise<Result<StockMovement, RepositoryError>>;

  /** Find stock movements for a product */
  findByProduct(productId: string): Promise<Result<StockMovement[], RepositoryError>>;

  /** Find stock movements for a company with optional filters */
  findByCompany(companyId: string, filters?: StockMovementFilters): Promise<Result<StockMovement[], RepositoryError>>;

  /** Find stock movements by reason */
  findByReason(companyId: string, reason: MovementReason): Promise<Result<StockMovement[], RepositoryError>>;

  /** Create a new stock movement */
  create(movement: StockMovement): Promise<Result<StockMovement, RepositoryError>>;
}

/**
 * Supplier repository interface
 */

export interface SupplierFilters {
  search?: string;
  isActive?: boolean;
}

export interface ISupplierRepository {
  /** Find supplier by ID */
  findById(id: string): Promise<Result<Supplier, NotFoundError | RepositoryError>>;

  /** Find suppliers for a company */
  findByCompany(companyId: string, filters?: SupplierFilters): Promise<Result<Supplier[], RepositoryError>>;

  /** Create a new supplier */
  create(supplier: Supplier): Promise<Result<Supplier, RepositoryError>>;

  /** Update an existing supplier */
  update(supplier: Supplier): Promise<Result<Supplier, RepositoryError>>;

  /** Delete a supplier */
  delete(id: string): Promise<Result<void, RepositoryError>>;
}

import type { Supplier } from "@/entities/Inventory";

/**
 * Purchase repository interface
 */

export interface PurchaseFilters {
  supplierId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface IPurchaseRepository {
  /** Find purchase by ID */
  findById(id: string): Promise<Result<Purchase, NotFoundError | RepositoryError>>;

  /** Find purchases for a company with optional filters */
  findByCompany(companyId: string, filters?: PurchaseFilters): Promise<Result<Purchase[], RepositoryError>>;

  /** Find purchases by supplier */
  findBySupplier(supplierId: string): Promise<Result<Purchase[], RepositoryError>>;

  /** Create a new purchase */
  create(purchase: Purchase): Promise<Result<Purchase, RepositoryError>>;

  /** Update an existing purchase */
  update(purchase: Purchase): Promise<Result<Purchase, RepositoryError>>;

  /** Delete a purchase */
  delete(id: string): Promise<Result<void, RepositoryError>>;
}

import type { Purchase } from "@/entities/Inventory";
