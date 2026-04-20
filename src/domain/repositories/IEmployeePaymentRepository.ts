/**
 * EmployeePayment repository interface
 */

import { Result } from "@/shared/kernel";
import type { EmployeePayment } from "@/entities/EmployeePayment";
import type { PaymentType, PaymentStatus } from "@/entities/EmployeePayment";
import type { RepositoryError, NotFoundError } from "@/shared/kernel/errors";

export interface IEmployeePaymentRepository {
  findById(id: string): Promise<Result<EmployeePayment, NotFoundError | RepositoryError>>;
  findByEmployeeId(employeeId: string): Promise<Result<EmployeePayment[], RepositoryError>>;
  findByCompanyAndPeriod(companyId: string, month?: number, year?: number): Promise<Result<EmployeePayment[], RepositoryError>>;
  findByOrderId(orderId: string): Promise<Result<EmployeePayment[], RepositoryError>>;
  getTotalByEmployee(employeeId: string, type?: PaymentType, status?: PaymentStatus): Promise<Result<number, RepositoryError>>;
  getTotalByCompany(companyId: string, month?: number, year?: number): Promise<Result<number, RepositoryError>>;
  create(payment: EmployeePayment): Promise<Result<EmployeePayment, RepositoryError>>;
  update(payment: EmployeePayment): Promise<Result<EmployeePayment, RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;
}
