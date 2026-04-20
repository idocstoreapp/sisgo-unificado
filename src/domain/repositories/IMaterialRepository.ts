/**
 * Material repository interface
 */

import { Result } from "@/shared/kernel";
import type { Material } from "@/entities/Material";
import type { RepositoryError, NotFoundError } from "@/shared/kernel/errors";

export interface MaterialFilters {
  category?: string;
  search?: string;
  lowStock?: boolean;
  isActive?: boolean;
}

export interface IMaterialRepository {
  /** Find material by ID */
  findById(id: string): Promise<Result<Material, NotFoundError | RepositoryError>>;

  /** Find materials for a company with optional filters */
  findByCompany(companyId: string, filters?: MaterialFilters): Promise<Result<Material[], RepositoryError>>;

  /** Find materials by category */
  findByCategory(companyId: string, category: string): Promise<Result<Material[], RepositoryError>>;

  /** Find materials with low stock */
  findLowStock(companyId: string): Promise<Result<Material[], RepositoryError>>;

  /** Create a new material */
  create(material: Material): Promise<Result<Material, RepositoryError>>;

  /** Update an existing material */
  update(material: Material): Promise<Result<Material, RepositoryError>>;

  /** Delete a material */
  delete(id: string): Promise<Result<void, RepositoryError>>;
}
