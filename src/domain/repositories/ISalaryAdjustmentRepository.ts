/**
 * SalaryAdjustment repository interface
 */

import { Result } from "@/shared/kernel";
import type { SalaryAdjustment } from "@/entities/SalaryAdjustment";
import type { AdjustmentType } from "@/entities/SalaryAdjustment";
import type { RepositoryError, NotFoundError } from "@/shared/kernel/errors";

export interface ISalaryAdjustmentRepository {
  findById(id: string): Promise<Result<SalaryAdjustment, NotFoundError | RepositoryError>>;
  findByEmployee(employeeId: string): Promise<Result<SalaryAdjustment[], RepositoryError>>;
  findByCompany(companyId: string): Promise<Result<SalaryAdjustment[], RepositoryError>>;
  getPendingByEmployee(employeeId: string): Promise<Result<SalaryAdjustment[], RepositoryError>>;
  getTotalByType(employeeId: string, type: AdjustmentType): Promise<Result<number, RepositoryError>>;
  create(adjustment: SalaryAdjustment): Promise<Result<SalaryAdjustment, RepositoryError>>;
  update(adjustment: SalaryAdjustment): Promise<Result<SalaryAdjustment, RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;
}
