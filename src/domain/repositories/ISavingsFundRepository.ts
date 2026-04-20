/**
 * SavingsFund repository interface
 */

import { Result } from "@/shared/kernel";
import type { SavingsFund } from "@/entities/SavingsFund";
import type { RepositoryError, NotFoundError } from "@/shared/kernel/errors";

export interface ISavingsFundRepository {
  findById(id: string): Promise<Result<SavingsFund, NotFoundError | RepositoryError>>;
  findByCompany(companyId: string): Promise<Result<SavingsFund[], RepositoryError>>;
  getBalance(companyId: string): Promise<Result<number, RepositoryError>>;
  getTotalDeposits(companyId: string, month?: number, year?: number): Promise<Result<number, RepositoryError>>;
  getTotalWithdrawals(companyId: string, month?: number, year?: number): Promise<Result<number, RepositoryError>>;
  create(savingsFund: SavingsFund): Promise<Result<SavingsFund, RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;
}
