/**
 * EmployeePayment entity - represents a payment to an employee (commission, salary, advance, etc.)
 */

import { Result, ValidationError, BusinessRuleError } from "@/shared/kernel";

export type PaymentType = "commission" | "salary" | "bonus" | "advance" | "discount";
export type PaymentStatus = "pending" | "paid" | "cancelled";

export interface EmployeePaymentProps {
  id: string;
  companyId: string;
  employeeId: string;
  orderId?: string;
  paymentType: PaymentType;
  amount: number;
  commissionPercentage?: number;
  weekStart?: Date;
  month?: number;
  year?: number;
  status: PaymentStatus;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class EmployeePayment {
  private constructor(private props: EmployeePaymentProps) {}

  // Getters
  get id(): string { return this.props.id; }
  get companyId(): string { return this.props.companyId; }
  get employeeId(): string { return this.props.employeeId; }
  get orderId(): string | undefined { return this.props.orderId; }
  get paymentType(): PaymentType { return this.props.paymentType; }
  get amount(): number { return this.props.amount; }
  get commissionPercentage(): number | undefined { return this.props.commissionPercentage; }
  get weekStart(): Date | undefined { return this.props.weekStart; }
  get month(): number | undefined { return this.props.month; }
  get year(): number | undefined { return this.props.year; }
  get status(): PaymentStatus { return this.props.status; }
  get paidAt(): Date | undefined { return this.props.paidAt; }
  get notes(): string | undefined { return this.props.notes; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  /**
   * Mark payment as paid
   */
  markAsPaid(): Result<void, BusinessRuleError> {
    if (this.props.status === "paid") {
      return Result.fail(new BusinessRuleError("Payment is already paid"));
    }
    if (this.props.status === "cancelled") {
      return Result.fail(new BusinessRuleError("Cannot pay a cancelled payment"));
    }
    this.props.status = "paid";
    this.props.paidAt = new Date();
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Cancel payment
   */
  cancel(): Result<void, BusinessRuleError> {
    if (this.props.status === "paid") {
      return Result.fail(new BusinessRuleError("Cannot cancel a paid payment"));
    }
    this.props.status = "cancelled";
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Check if payment is for current week
   */
  isCurrentWeek(referenceDate: Date = new Date()): boolean {
    if (!this.props.weekStart) return false;
    const weekStart = new Date(this.props.weekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return referenceDate >= weekStart && referenceDate <= weekEnd;
  }

  /**
   * Check if payment is for current month
   */
  isCurrentMonth(referenceDate: Date = new Date()): boolean {
    if (!this.props.month || !this.props.year) return false;
    const now = referenceDate;
    return this.props.month === now.getMonth() + 1 && this.props.year === now.getFullYear();
  }

  /**
   * Calculate commission amount from order total
   */
  static calculateCommission(orderTotal: number, costPrice: number, percentage: number): number {
    const netProfit = orderTotal - costPrice;
    if (netProfit <= 0) return 0;
    return Math.round(netProfit * (percentage / 100));
  }

  /**
   * Create a new employee payment with validation
   */
  static create(props: Omit<EmployeePaymentProps, "createdAt" | "updatedAt" | "status"> & Partial<Pick<EmployeePaymentProps, "createdAt" | "updatedAt" | "status">>): Result<EmployeePayment, ValidationError> {
    // Validate amount
    if (props.amount < 0) {
      return Result.fail(new ValidationError("Amount cannot be negative", "NEGATIVE_AMOUNT"));
    }

    // Validate commission percentage
    if (props.commissionPercentage !== undefined && (props.commissionPercentage < 0 || props.commissionPercentage > 100)) {
      return Result.fail(new ValidationError("Commission percentage must be between 0 and 100", "INVALID_COMMISSION"));
    }

    // Validate month
    if (props.month !== undefined && (props.month < 1 || props.month > 12)) {
      return Result.fail(new ValidationError("Month must be between 1 and 12", "INVALID_MONTH"));
    }

    return Result.ok(
      new EmployeePayment({
        ...props,
        status: props.status ?? "pending",
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      })
    );
  }
}
