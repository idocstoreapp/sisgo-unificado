/**
 * User repository interface
 */

import { Result } from "@/shared/kernel";
import type { User } from "@/entities/User";
import type { RepositoryError, NotFoundError } from "@/shared/kernel/errors";

export interface IUserRepository {
  /** Find user by ID */
  findById(id: string): Promise<Result<User, NotFoundError | RepositoryError>>;

  /** Find user by email and company */
  findByEmailAndCompany(email: string, companyId: string): Promise<Result<User | null, RepositoryError>>;

  /** Find all users for a company */
  findByCompanyId(companyId: string): Promise<Result<User[], RepositoryError>>;

  /** Find users for a specific branch */
  findByBranchId(branchId: string): Promise<Result<User[], RepositoryError>>;

  /** Find users by role in a company */
  findByRole(companyId: string, role: string): Promise<Result<User[], RepositoryError>>;

  /** Create a new user */
  create(user: User): Promise<Result<User, RepositoryError>>;

  /** Update an existing user */
  update(user: User): Promise<Result<User, RepositoryError>>;

  /** Delete a user */
  delete(id: string): Promise<Result<void, RepositoryError>>;
}
