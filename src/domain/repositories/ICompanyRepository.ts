/**
 * Company repository interface
 */

import { Result } from "@/shared/kernel";
import type { Company } from "@/entities/Company";
import type { RepositoryError, NotFoundError } from "@/shared/kernel/errors";

export interface ICompanyRepository {
  /** Find company by ID */
  findById(id: string): Promise<Result<Company, NotFoundError | RepositoryError>>;

  /** Find company by RUT */
  findByRut(rut: string): Promise<Result<Company | null, RepositoryError>>;

  /** Find all companies for a user (by auth user ID) */
  findByUserId(userId: string): Promise<Result<Company[], RepositoryError>>;

  /** Create a new company */
  create(company: Company): Promise<Result<Company, RepositoryError>>;

  /** Update an existing company */
  update(company: Company): Promise<Result<Company, RepositoryError>>;

  /** Delete a company */
  delete(id: string): Promise<Result<void, RepositoryError>>;
}
