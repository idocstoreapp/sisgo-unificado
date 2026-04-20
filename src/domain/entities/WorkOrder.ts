/**
 * WorkOrder entity - represents a service/repair order
 */

import { Result, ValidationError, BusinessRuleError } from "@/shared/kernel";
import type { OrderStatus, Priority, PaymentMethod } from "@/shared/kernel/types";

export interface WorkOrderProps {
  id: string;
  companyId: string;
  branchId?: string;
  customerId: string;
  assignedTo?: string;
  createdBy?: string;
  orderNumber: string;
  businessType: string;
  metadata: Record<string, unknown>;
  status: OrderStatus;
  priority: Priority;
  commitmentDate?: Date;
  deliveredAt?: Date;
  replacementCost: number;
  laborCost: number;
  totalCost: number;
  totalPrice: number;
  paymentMethod?: PaymentMethod;
  receiptNumber?: string;
  paidAt?: Date;
  warrantyDays: number;
  warrantyExpiresAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class WorkOrder {
  private constructor(private props: WorkOrderProps) {}

  // Getters
  get id(): string { return this.props.id; }
  get companyId(): string { return this.props.companyId; }
  get branchId(): string | undefined { return this.props.branchId; }
  get customerId(): string { return this.props.customerId; }
  get assignedTo(): string | undefined { return this.props.assignedTo; }
  get createdBy(): string | undefined { return this.props.createdBy; }
  get orderNumber(): string { return this.props.orderNumber; }
  get businessType(): string { return this.props.businessType; }
  get metadata(): Record<string, unknown> { return this.props.metadata; }
  get status(): OrderStatus { return this.props.status; }
  get priority(): Priority { return this.props.priority; }
  get commitmentDate(): Date | undefined { return this.props.commitmentDate; }
  get deliveredAt(): Date | undefined { return this.props.deliveredAt; }
  get replacementCost(): number { return this.props.replacementCost; }
  get laborCost(): number { return this.props.laborCost; }
  get totalCost(): number { return this.props.totalCost; }
  get totalPrice(): number { return this.props.totalPrice; }
  get paymentMethod(): PaymentMethod | undefined { return this.props.paymentMethod; }
  get receiptNumber(): string | undefined { return this.props.receiptNumber; }
  get paidAt(): Date | undefined { return this.props.paidAt; }
  get warrantyDays(): number { return this.props.warrantyDays; }
  get warrantyExpiresAt(): Date | undefined { return this.props.warrantyExpiresAt; }
  get notes(): string | undefined { return this.props.notes; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  /**
   * Calculate costs from services and replacement parts
   */
  calculateCosts(servicesTotal: number, replacementTotal: number): void {
    this.props.laborCost = servicesTotal;
    this.props.replacementCost = replacementTotal;
    this.props.totalCost = servicesTotal + replacementTotal;
    this.props.updatedAt = new Date();
  }

  /**
   * Change order status with business rule validation
   */
  changeStatus(newStatus: OrderStatus): Result<void, ValidationError | BusinessRuleError> {
    // Business rules for status transitions
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      en_proceso: ["por_entregar", "rechazada", "sin_solucion"],
      por_entregar: ["entregada", "en_proceso"],
      entregada: ["garantia"],
      rechazada: [],
      sin_solucion: [],
      garantia: ["en_proceso"],
    };

    if (this.props.status === newStatus) {
      return Result.ok(undefined);
    }

    const allowedTransitions = validTransitions[this.props.status];
    if (!allowedTransitions.includes(newStatus)) {
      return Result.fail(
        new BusinessRuleError(
          `Invalid status transition from "${this.props.status}" to "${newStatus}"`,
          "INVALID_STATUS_TRANSITION"
        )
      );
    }

    // If delivering, set deliveredAt and calculate warranty
    if (newStatus === "entregada" && !this.props.deliveredAt) {
      this.props.deliveredAt = new Date();
      if (this.props.warrantyDays > 0) {
        const warrantyDate = new Date();
        warrantyDate.setDate(warrantyDate.getDate() + this.props.warrantyDays);
        this.props.warrantyExpiresAt = warrantyDate;
      }
    }

    this.props.status = newStatus;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Update priority
   */
  updatePriority(priority: Priority): Result<void, ValidationError> {
    this.props.priority = priority;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Assign to a technician
   */
  assignTo(technicianId: string): void {
    this.props.assignedTo = technicianId;
    this.props.updatedAt = new Date();
  }

  /**
   * Set commitment date
   */
  setCommitmentDate(date: Date): void {
    this.props.commitmentDate = date;
    this.props.updatedAt = new Date();
  }

  /**
   * Mark as paid
   */
  markAsPaid(paymentMethod: PaymentMethod, receiptNumber?: string): void {
    this.props.paymentMethod = paymentMethod;
    this.props.receiptNumber = receiptNumber;
    this.props.paidAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Update total price (sale price to customer)
   */
  updateTotalPrice(price: number): Result<void, ValidationError> {
    if (price < 0) {
      return Result.fail(new ValidationError("Price cannot be negative", "NEGATIVE_PRICE"));
    }
    this.props.totalPrice = price;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Get metadata value by key
   */
  getMetadata<T>(key: string): T | undefined {
    return this.props.metadata[key] as T | undefined;
  }

  /**
   * Set metadata value
   */
  setMetadata(key: string, value: unknown): void {
    this.props.metadata = {
      ...this.props.metadata,
      [key]: value,
    };
    this.props.updatedAt = new Date();
  }

  /**
   * Check if order is completed
   */
  isCompleted(): boolean {
    return ["entregada", "rechazada", "sin_solucion"].includes(this.props.status);
  }

  /**
   * Check if order is in warranty
   */
  isInWarranty(): boolean {
    if (this.props.status !== "entregada" || !this.props.warrantyExpiresAt) {
      return false;
    }
    return new Date() <= this.props.warrantyExpiresAt;
  }

  /**
   * Check if order is overdue
   */
  isOverdue(): boolean {
    if (!this.props.commitmentDate || this.isCompleted()) {
      return false;
    }
    return new Date() > this.props.commitmentDate;
  }

  /**
   * Check if order is paid
   */
  isPaid(): boolean {
    return !!this.props.paidAt;
  }

  /**
   * Create a new work order with validation
   */
  static create(props: Omit<WorkOrderProps, "createdAt" | "updatedAt" | "status" | "totalCost" | "metadata"> & Partial<Pick<WorkOrderProps, "createdAt" | "updatedAt" | "status" | "totalCost" | "metadata">>): Result<WorkOrder, ValidationError> {
    // Validate customerId
    if (!props.customerId) {
      return Result.fail(new ValidationError("Customer is required", "CUSTOMER_REQUIRED"));
    }

    // Validate companyId
    if (!props.companyId) {
      return Result.fail(new ValidationError("Company is required", "COMPANY_REQUIRED"));
    }

    // Validate warranty days
    if (props.warrantyDays < 0) {
      return Result.fail(new ValidationError("Warranty days cannot be negative", "INVALID_WARRANTY"));
    }

    // Validate costs are non-negative
    if (props.replacementCost < 0) {
      return Result.fail(new ValidationError("Replacement cost cannot be negative", "NEGATIVE_COST"));
    }

    if (props.laborCost < 0) {
      return Result.fail(new ValidationError("Labor cost cannot be negative", "NEGATIVE_COST"));
    }

    const totalCost = (props.replacementCost ?? 0) + (props.laborCost ?? 0);

    return Result.ok(
      new WorkOrder({
        ...props,
        status: props.status ?? "en_proceso",
        metadata: props.metadata ?? {},
        totalCost: props.totalCost ?? totalCost,
        totalPrice: props.totalPrice ?? 0,
        priority: props.priority ?? "media",
        warrantyDays: props.warrantyDays ?? 30,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      })
    );
  }
}
