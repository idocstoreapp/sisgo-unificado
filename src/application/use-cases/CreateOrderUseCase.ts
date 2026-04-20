/**
 * CreateOrderUseCase - creates a new work order
 */

import { Result, ValidationError, RepositoryError, UnexpectedError } from "@/shared/kernel";
import { WorkOrder } from "@/domain/entities/WorkOrder";
import type { IWorkOrderRepository } from "@/domain/repositories/IWorkOrderRepository";
import type { CreateOrderDTO, OrderOutputDTO } from "@/application/dtos/OrderDTOs";

type CreateOrderError = ValidationError | RepositoryError | UnexpectedError;

export class CreateOrderUseCase {
  constructor(private readonly orderRepository: IWorkOrderRepository) {}

  async execute(input: CreateOrderDTO): Promise<Result<OrderOutputDTO, CreateOrderError>> {
    try {
      // Step 1: Generate order number
      const orderNumberResult = await this.orderRepository.getNextOrderNumber(input.companyId);
      if (orderNumberResult.isFailure) {
        return Result.fail(orderNumberResult.getError());
      }
      const orderNumber = orderNumberResult.getValue();

      // Step 2: Calculate total cost
      const replacementCost = input.replacementCost ?? 0;
      const laborCost = input.laborCost ?? 0;
      const totalCost = replacementCost + laborCost;

      // Step 3: Create order entity with validation
      const orderResult = WorkOrder.create({
        id: crypto.randomUUID(),
        companyId: input.companyId,
        branchId: input.branchId,
        customerId: input.customerId,
        assignedTo: input.assignedTo,
        createdBy: input.createdBy,
        orderNumber,
        businessType: input.businessType,
        priority: input.priority ?? "media",
        commitmentDate: input.commitmentDate,
        warrantyDays: input.warrantyDays ?? 30,
        notes: input.notes,
        metadata: input.metadata ?? {},
        replacementCost,
        laborCost,
        totalCost,
        totalPrice: input.totalPrice ?? totalCost,
      });

      if (orderResult.isFailure) {
        return Result.fail(orderResult.getError());
      }

      const order = orderResult.getValue();

      // Step 4: Save order to database
      const savedOrderResult = await this.orderRepository.create(order);
      if (savedOrderResult.isFailure) {
        return Result.fail(savedOrderResult.getError());
      }

      const savedOrder = savedOrderResult.getValue();

      // TODO: Step 5: Save order items (services) when we have OrderItems repository

      // Step 6: Return DTO
      return Result.ok(this.toOutput(savedOrder));
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
