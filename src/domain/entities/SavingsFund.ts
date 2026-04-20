/**
 * SavingsFund entity - represents company savings fund movements
 */

import { Result, ValidationError } from "@/shared/kernel";

export type SavingsFundType = "deposit" | "withdrawal";

export interface SavingsFundProps {
  id: string;
  companyId: string;
  amount: number;
  type: SavingsFundType;
  reason?: string;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
}

export class SavingsFund {
  private constructor(private props: SavingsFundProps) {}

  get id(): string { return this.props.id; }
  get companyId(): string { return this.props.companyId; }
  get amount(): number { return this.props.amount; }
  get type(): SavingsFundType { return this.props.type; }
  get reason(): string | undefined { return this.props.reason; }
  get notes(): string | undefined { return this.props.notes; }
  get createdBy(): string | undefined { return this.props.createdBy; }
  get createdAt(): Date { return this.props.createdAt; }

  /**
   * Check if movement is a deposit
   */
  isDeposit(): boolean {
    return this.props.type === "deposit";
  }

  /**
   * Check if movement is a withdrawal
   */
  isWithdrawal(): boolean {
    return this.props.type === "withdrawal";
  }

  /**
   * Create a new savings fund movement with validation
   */
  static create(props: Omit<SavingsFundProps, "createdAt"> & Partial<Pick<SavingsFundProps, "createdAt">>): Result<SavingsFund, ValidationError> {
    if (props.amount <= 0) {
      return Result.fail(new ValidationError("Amount must be positive", "INVALID_AMOUNT"));
    }

    return Result.ok(
      new SavingsFund({
        ...props,
        reason: props.reason?.trim(),
        notes: props.notes?.trim(),
        createdAt: props.createdAt ?? new Date(),
      })
    );
  }
}
