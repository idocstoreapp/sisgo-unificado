/**
 * Service repository interface
 */

import { Result } from "@/shared/kernel";
import type { Service } from "@/entities/Service";
import type { RepositoryError, NotFoundError } from "@/shared/kernel/errors";

export interface ServiceRepository {
  /** Find service by ID */
  findById(id: string): Promise<Result<Service, NotFoundError | RepositoryError>>;

  /** Find services for a company */
  findByCompany(companyId: string, category?: string): Promise<Result<Service[], RepositoryError>>;

  /** Find services by category */
  findByCategory(companyId: string, category: string): Promise<Result<Service[], RepositoryError>>;

  /** Create a new service */
  create(service: Service): Promise<Result<Service, RepositoryError>>;

  /** Update an existing service */
  update(service: Service): Promise<Result<Service, RepositoryError>>;

  /** Delete a service */
  delete(id: string): Promise<Result<void, RepositoryError>>;
}
