/**
 * Expense entity - represents a company expense
 */

import { Result, ValidationError } from "@/shared/kernel";

export interface ExpenseProps {
  id: string;
  companyId: string;
  branchId?: string;
  createdBy?: string;
  expenseType: string;
  category?: string;
  amount: number;
  paymentMethod?: string;
  receiptNumber?: string;
  receiptUrl?: string;
  expenseDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class Expense {
  private constructor(private props: ExpenseProps) {}

  get id(): string { return this.props.id; }
  get companyId(): string { return this.props.companyId; }
  get branchId(): string | undefined { return this.props.branchId; }
  get createdBy(): string | undefined { return this.props.createdBy; }
  get expenseType(): string { return this.props.expenseType; }
  get category(): string | undefined { return this.props.category; }
  get amount(): number { return this.props.amount; }
  get paymentMethod(): string | undefined { return this.props.paymentMethod; }
  get receiptNumber(): string | undefined { return this.props.receiptNumber; }
  get receiptUrl(): string | undefined { return this.props.receiptUrl; }
  get expenseDate(): Date { return this.props.expenseDate; }
  get notes(): string | undefined { return this.props.notes; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  /**
   * Check if expense is for current month
   */
  isCurrentMonth(referenceDate: Date = new Date()): boolean {
    const now = referenceDate;
    return (
      this.props.expenseDate.getMonth() === now.getMonth() &&
      this.props.expenseDate.getFullYear() === now.getFullYear()
    );
  }

  /**
   * Check if expense is for current week
   */
  isCurrentWeek(referenceDate: Date = new Date()): boolean {
    const now = referenceDate;
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return this.props.expenseDate >= weekStart && this.props.expenseDate <= weekEnd;
  }

  /**
   * Create a new expense with validation
   */
  static create(props: Omit<ExpenseProps, "createdAt" | "updatedAt"> & Partial<Pick<ExpenseProps, "createdAt" | "updatedAt">>): Result<Expense, ValidationError> {
    if (props.amount < 0) {
      return Result.fail(new ValidationError("Amount cannot be negative", "NEGATIVE_AMOUNT"));
    }

    if (!props.expenseType || props.expenseType.trim().length === 0) {
      return Result.fail(new ValidationError("Expense type is required", "TYPE_REQUIRED"));
    }

    return Result.ok(
      new Expense({
        ...props,
        expenseType: props.expenseType.trim(),
        category: props.category?.trim(),
        notes: props.notes?.trim(),
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      })
    );
  }
}
