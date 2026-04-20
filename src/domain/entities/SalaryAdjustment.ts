/**
 * SalaryAdjustment entity - represents advances or discounts to employee salary
 */

import { Result, ValidationError } from "@/shared/kernel";

export type AdjustmentType = "advance" | "discount";

export interface SalaryAdjustmentProps {
  id: string;
  companyId: string;
  employeeId: string;
  type: AdjustmentType;
  amount: number;
  loanType?: string;
  notes?: string;
  remainingBalance?: number;
  isFullyPaid: boolean;
  createdAt: Date;
}

export class SalaryAdjustment {
  private constructor(private props: SalaryAdjustmentProps) {}

  get id(): string { return this.props.id; }
  get companyId(): string { return this.props.companyId; }
  get employeeId(): string { return this.props.employeeId; }
  get type(): AdjustmentType { return this.props.type; }
  get amount(): number { return this.props.amount; }
  get loanType(): string | undefined { return this.props.loanType; }
  get notes(): string | undefined { return this.props.notes; }
  get remainingBalance(): number | undefined { return this.props.remainingBalance; }
  get isFullyPaid(): boolean { return this.props.isFullyPaid; }
  get createdAt(): Date { return this.props.createdAt; }

  /**
   * Apply payment towards the adjustment
   */
  applyPayment(amount: number): Result<void, ValidationError> {
    if (amount <= 0) {
      return Result.fail(new ValidationError("Payment amount must be positive", "INVALID_PAYMENT"));
    }

    if (this.props.isFullyPaid) {
      return Result.fail(new ValidationError("Adjustment is already fully paid", "ALREADY_PAID"));
    }

    const currentBalance = this.props.remainingBalance ?? this.props.amount;
    const newBalance = Math.max(0, currentBalance - amount);

    this.props.remainingBalance = newBalance;
    this.props.isFullyPaid = newBalance <= 0;

    return Result.ok(undefined);
  }

  /**
   * Check if adjustment is an advance
   */
  isAdvance(): boolean {
    return this.props.type === "advance";
  }

  /**
   * Check if adjustment is a discount
   */
  isDiscount(): boolean {
    return this.props.type === "discount";
  }

  /**
   * Get paid amount
   */
  getPaidAmount(): number {
    const currentBalance = this.props.remainingBalance ?? this.props.amount;
    return this.props.amount - currentBalance;
  }

  /**
   * Create a new salary adjustment with validation
   */
  static create(props: Omit<SalaryAdjustmentProps, "createdAt" | "isFullyPaid" | "remainingBalance"> & Partial<Pick<SalaryAdjustmentProps, "createdAt" | "isFullyPaid" | "remainingBalance">>): Result<SalaryAdjustment, ValidationError> {
    if (props.amount <= 0) {
      return Result.fail(new ValidationError("Amount must be positive", "INVALID_AMOUNT"));
    }

    return Result.ok(
      new SalaryAdjustment({
        ...props,
        isFullyPaid: props.isFullyPaid ?? false,
        remainingBalance: props.remainingBalance ?? props.amount,
        loanType: props.loanType?.trim(),
        notes: props.notes?.trim(),
        createdAt: props.createdAt ?? new Date(),
      })
    );
  }
}
