/**
 * Expense repository interface
 */

import { Result } from "@/shared/kernel";
import type { Expense } from "@/entities/Expense";
import type { RepositoryError, NotFoundError } from "@/shared/kernel/errors";

export interface ExpenseFilters {
  type?: string;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  branchId?: string;
}

export interface IExpenseRepository {
  findById(id: string): Promise<Result<Expense, NotFoundError | RepositoryError>>;
  findByCompany(companyId: string, filters?: ExpenseFilters): Promise<Result<Expense[], RepositoryError>>;
  getTotalByCompany(companyId: string, month?: number, year?: number): Promise<Result<number, RepositoryError>>;
  getTotalByType(companyId: string, type: string, month?: number, year?: number): Promise<Result<number, RepositoryError>>;
  create(expense: Expense): Promise<Result<Expense, RepositoryError>>;
  update(expense: Expense): Promise<Result<Expense, RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;
}
