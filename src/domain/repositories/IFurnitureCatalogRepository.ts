/**
 * Furniture Catalog repository interface
 */

import { Result } from "@/shared/kernel";
import type { FurnitureCatalog } from "@/entities/FurnitureCatalog";
import type { RepositoryError, NotFoundError } from "@/shared/kernel/errors";

export interface FurnitureCatalogRepository {
  /** Find furniture catalog by ID */
  findById(id: string): Promise<Result<FurnitureCatalog, NotFoundError | RepositoryError>>;

  /** Find furniture catalogs for a company */
  findByCompany(companyId: string, category?: string): Promise<Result<FurnitureCatalog[], RepositoryError>>;

  /** Find furniture catalogs by category */
  findByCategory(companyId: string, category: string): Promise<Result<FurnitureCatalog[], RepositoryError>>;

  /** Create a new furniture catalog */
  create(furniture: FurnitureCatalog): Promise<Result<FurnitureCatalog, RepositoryError>>;

  /** Update an existing furniture catalog */
  update(furniture: FurnitureCatalog): Promise<Result<FurnitureCatalog, RepositoryError>>;

  /** Delete a furniture catalog */
  delete(id: string): Promise<Result<void, RepositoryError>>;
}
