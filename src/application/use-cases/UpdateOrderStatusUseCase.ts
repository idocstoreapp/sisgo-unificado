/**
 * UpdateOrderStatusUseCase - changes the status of a work order
 */

import { Result, ValidationError, BusinessRuleError, NotFoundError, RepositoryError, UnexpectedError } from "@/shared/kernel";
import type { IWorkOrderRepository } from "@/domain/repositories/IWorkOrderRepository";
import type { OrderStatus } from "@/shared/kernel/types";
import type { OrderOutputDTO } from "@/application/dtos/OrderDTOs";

type UpdateOrderStatusError = ValidationError | BusinessRuleError | NotFoundError | RepositoryError | UnexpectedError;

export class UpdateOrderStatusUseCase {
  constructor(private readonly orderRepository: IWorkOrderRepository) {}

  async execute(orderId: string, newStatus: OrderStatus): Promise<Result<OrderOutputDTO, UpdateOrderStatusError>> {
    try {
      // Step 1: Fetch order
      const orderResult = await this.orderRepository.findById(orderId);
      if (orderResult.isFailure) {
        return Result.fail(orderResult.getError());
      }

      const order = orderResult.getValue();

      // Step 2: Validate and apply status change
      const statusChangeResult = order.changeStatus(newStatus);
      if (statusChangeResult.isFailure) {
        return Result.fail(statusChangeResult.getError());
      }

      // Step 3: Save updated order
      const updatedOrderResult = await this.orderRepository.update(order);
      if (updatedOrderResult.isFailure) {
        return Result.fail(updatedOrderResult.getError());
      }

      const updatedOrder = updatedOrderResult.getValue();

      // Step 4: Return DTO
      return Result.ok(this.toOutput(updatedOrder));
    } catch (error) {
      return Result.fail(UnexpectedError.from(error));
    }
  }

  private toOutput(order: WorkOrder): OrderOutputDTO {
    return {
      id: order.id,
      companyId: order.companyId,
      branchId: order.branchId ?? null,
      customerId: order.customerId,
      assignedTo: order.assignedTo ?? null,
      createdBy: order.createdBy ?? null,
      orderNumber: order.orderNumber,
      businessType: order.businessType,
      metadata: order.metadata,
      status: order.status,
      priority: order.priority,
      commitmentDate: order.commitmentDate ?? null,
      deliveredAt: order.deliveredAt ?? null,
      replacementCost: order.replacementCost,
      laborCost: order.laborCost,
      totalCost: order.totalCost,
      totalPrice: order.totalPrice,
      paymentMethod: order.paymentMethod ?? null,
      receiptNumber: order.receiptNumber ?? null,
      paidAt: order.paidAt ?? null,
      warrantyDays: order.warrantyDays,
      warrantyExpiresAt: order.warrantyExpiresAt ?? null,
      notes: order.notes ?? null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt ?? null,
      isCompleted: order.isCompleted(),
      isInWarranty: order.isInWarranty(),
      isOverdue: order.isOverdue(),
      isPaid: order.isPaid(),
    };
  }
}

import type { WorkOrder } from "@/domain/entities/WorkOrder";
