/**
 * Product repository interface
 */

import { Result } from "@/shared/kernel";
import type { Product } from "@/entities/Product";
import type { RepositoryError, NotFoundError } from "@/shared/kernel/errors";

export interface ProductFilters {
  category?: string;
  type?: string;
  search?: string;
  lowStock?: boolean;
  isActive?: boolean;
  barcode?: string;
}

export interface IProductRepository {
  /** Find product by ID */
  findById(id: string): Promise<Result<Product, NotFoundError | RepositoryError>>;

  /** Find product by barcode */
  findByBarcode(barcode: string, companyId: string): Promise<Result<Product | null, RepositoryError>>;

  /** Find products for a company with optional filters */
  findByCompany(companyId: string, filters?: ProductFilters): Promise<Result<Product[], RepositoryError>>;

  /** Find products by category */
  findByCategory(companyId: string, category: string): Promise<Result<Product[], RepositoryError>>;

  /** Find products with low stock */
  findLowStock(companyId: string): Promise<Result<Product[], RepositoryError>>;

  /** Create a new product */
  create(product: Product): Promise<Result<Product, RepositoryError>>;

  /** Update an existing product */
  update(product: Product): Promise<Result<Product, RepositoryError>>;

  /** Delete a product */
  delete(id: string): Promise<Result<void, RepositoryError>>;
}
