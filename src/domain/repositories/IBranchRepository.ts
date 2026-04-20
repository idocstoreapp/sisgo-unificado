/**
 * Branch repository interface
 */

import { Result } from "@/shared/kernel";
import type { Branch } from "@/entities/Branch";
import type { RepositoryError, NotFoundError } from "@/shared/kernel/errors";

export interface IBranchRepository {
  /** Find branch by ID */
  findById(id: string): Promise<Result<Branch, NotFoundError | RepositoryError>>;

  /** Find all branches for a company */
  findByCompanyId(companyId: string): Promise<Result<Branch[], RepositoryError>>;

  /** Create a new branch */
  create(branch: Branch): Promise<Result<Branch, RepositoryError>>;

  /** Update an existing branch */
  update(branch: Branch): Promise<Result<Branch, RepositoryError>>;

  /** Delete a branch */
  delete(id: string): Promise<Result<void, RepositoryError>>;
}
