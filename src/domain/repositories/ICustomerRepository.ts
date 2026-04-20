/**
 * Customer repository interface
 */

import { Result } from "@/shared/kernel";
import type { Customer } from "@/entities/Customer";
import type { RepositoryError, NotFoundError } from "@/shared/kernel/errors";

export interface ICustomerRepository {
  /** Find customer by ID */
  findById(id: string): Promise<Result<Customer, NotFoundError | RepositoryError>>;

  /** Find customer by email and company */
  findByEmailAndCompany(email: string, companyId: string): Promise<Result<Customer | null, RepositoryError>>;

  /** Find customer by phone and company */
  findByPhoneAndCompany(phone: string, companyId: string): Promise<Result<Customer | null, RepositoryError>>;

  /** Search customers by name for a company */
  searchByName(query: string, companyId: string): Promise<Result<Customer[], RepositoryError>>;

  /** Find all customers for a company */
  findByCompanyId(companyId: string): Promise<Result<Customer[], RepositoryError>>;

  /** Create a new customer */
  create(customer: Customer): Promise<Result<Customer, RepositoryError>>;

  /** Update an existing customer */
  update(customer: Customer): Promise<Result<Customer, RepositoryError>>;

  /** Delete a customer */
  delete(id: string): Promise<Result<void, RepositoryError>>;
}
