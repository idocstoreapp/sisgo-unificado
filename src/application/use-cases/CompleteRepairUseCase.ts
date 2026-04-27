/**
 * CompleteRepairUseCase - allows a technician to complete a repair, add replacement costs and notes, and move the order to por_entregar
 */

import { Result, ValidationError, BusinessRuleError, NotFoundError, RepositoryError, UnexpectedError } from "@/shared/kernel";
import type { IWorkOrderRepository } from "@/domain/repositories/IWorkOrderRepository";
import type { OrderOutputDTO } from "@/application/dtos/OrderDTOs";
import type { WorkOrder } from "@/domain/entities/WorkOrder";

type CompleteRepairError = ValidationError | BusinessRuleError | NotFoundError | RepositoryError | UnexpectedError;

export interface RepairPartInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CompleteRepairInput {
  orderId: string;
  technicianId: string;
  parts: RepairPartInput[];
  notes?: string;
  laborCost?: number;
}

export class CompleteRepairUseCase {
  constructor(private readonly orderRepository: IWorkOrderRepository) {}

  async execute(input: CompleteRepairInput): Promise<Result<OrderOutputDTO, CompleteRepairError>> {
    try {
      // Step 1: Fetch order
      const orderResult = await this.orderRepository.findById(input.orderId);
      if (orderResult.isFailure) {
        return Result.fail(orderResult.getError());
      }

      const order = orderResult.getValue();

      // Step 2: Validate business rules
      if (order.status !== "en_reparacion") {
        return Result.fail(new BusinessRuleError("La orden debe estar en reparación para poder completarla", "INVALID_ORDER_STATE"));
      }

      if (order.assignedTo !== input.technicianId) {
        return Result.fail(new BusinessRuleError("No puedes completar una reparación que no te fue asignada", "INVALID_TECHNICIAN"));
      }

      // Step 3: Calculate total replacement costs
      let totalReplacementCost = 0;
      for (const part of input.parts) {
        if (part.quantity <= 0 || part.unitPrice < 0) {
          return Result.fail(new ValidationError("Cantidades y precios de repuestos deben ser válidos", "INVALID_PART_VALUES"));
        }
        totalReplacementCost += part.quantity * part.unitPrice;
      }

      const newLaborCost = input.laborCost !== undefined ? input.laborCost : order.laborCost;

      // Update costs
      order.calculateCosts(newLaborCost, totalReplacementCost);

      // Add to metadata
      const existingMetadata = order.metadata || {};
      order.setMetadata("repair_parts", input.parts);
      order.setMetadata("repair_completed_at", new Date().toISOString());

      if (input.notes) {
        const existingNotes = order.notes ? order.notes + "\n" : "";
        order.setMetadata("repair_notes", existingNotes + input.notes);
      }

      // Change status to por_entregar
      const statusChangeResult = order.changeStatus("por_entregar");
      if (statusChangeResult.isFailure) {
        return Result.fail(statusChangeResult.getError());
      }

      // Step 4: Save updated order
      const updatedOrderResult = await this.orderRepository.update(order);
      if (updatedOrderResult.isFailure) {
        return Result.fail(updatedOrderResult.getError());
      }

      const updatedOrder = updatedOrderResult.getValue();

      // Note: we should theoretically save parts to the repair_parts table here.
      // But since we don't have a RepairPartsRepository in the domain yet, we stored it in metadata.
      // Ideally, a separate integration event or a unit of work would handle inserting into repair_parts table.

      // Step 5: Return DTO
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
