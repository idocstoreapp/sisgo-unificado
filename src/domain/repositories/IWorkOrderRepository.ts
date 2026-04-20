/**
 * WorkOrder repository interface
 */

import { Result } from "@/shared/kernel";
import type { WorkOrder } from "@/entities/WorkOrder";
import type { OrderStatus } from "@/shared/kernel/types";
import type { RepositoryError, NotFoundError } from "@/shared/kernel/errors";

export interface OrderFilters {
  status?: OrderStatus;
  priority?: string;
  assignedTo?: string;
  customerId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface IWorkOrderRepository {
  /** Find order by ID */
  findById(id: string): Promise<Result<WorkOrder, NotFoundError | RepositoryError>>;

  /** Find order by order number */
  findByOrderNumber(orderNumber: string, companyId: string): Promise<Result<WorkOrder | null, RepositoryError>>;

  /** Find orders for a company with optional filters */
  findByCompany(companyId: string, filters?: OrderFilters): Promise<Result<WorkOrder[], RepositoryError>>;

  /** Find orders assigned to a technician */
  findByAssignedTo(technicianId: string): Promise<Result<WorkOrder[], RepositoryError>>;

  /** Find orders for a customer */
  findByCustomer(customerId: string): Promise<Result<WorkOrder[], RepositoryError>>;

  /** Count orders by status for a company */
  countByStatus(companyId: string, status: OrderStatus): Promise<Result<number, RepositoryError>>;

  /** Create a new order */
  create(order: WorkOrder): Promise<Result<WorkOrder, RepositoryError>>;

  /** Update an existing order */
  update(order: WorkOrder): Promise<Result<WorkOrder, RepositoryError>>;

  /** Delete an order */
  delete(id: string): Promise<Result<void, RepositoryError>>;

  /** Generate next order number for a company */
  getNextOrderNumber(companyId: string): Promise<Result<string, RepositoryError>>;
}
