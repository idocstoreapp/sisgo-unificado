/**
 * Finance Use Cases
 */

import { Result, ValidationError, NotFoundError, RepositoryError, UnexpectedError } from "@/shared/kernel";
import { EmployeePayment } from "@/domain/entities/EmployeePayment";
import { Expense } from "@/domain/entities/Expense";
import { SavingsFund } from "@/domain/entities/SavingsFund";
import { SalaryAdjustment } from "@/domain/entities/SalaryAdjustment";
import type { IEmployeePaymentRepository } from "@/domain/repositories/IEmployeePaymentRepository";
import type { IExpenseRepository } from "@/domain/repositories/IExpenseRepository";
import type { ISavingsFundRepository } from "@/domain/repositories/ISavingsFundRepository";
import type { ISalaryAdjustmentRepository } from "@/domain/repositories/ISalaryAdjustmentRepository";
import type {
  CreateEmployeePaymentDTO,
  EmployeePaymentOutputDTO,
  CreateExpenseDTO,
  ExpenseOutputDTO,
  CreateSavingsFundDTO,
  SavingsFundOutputDTO,
  CreateSalaryAdjustmentDTO,
  SalaryAdjustmentOutputDTO,
  FinanceSummaryDTO,
} from "@/application/dtos/FinanceDTOs";

type FinanceError = ValidationError | NotFoundError | RepositoryError | UnexpectedError;

export class ProcessPaymentUseCase {
  constructor(private readonly paymentRepo: IEmployeePaymentRepository) {}

  async execute(input: CreateEmployeePaymentDTO): Promise<Result<EmployeePaymentOutputDTO, FinanceError>> {
    try {
      const result = EmployeePayment.create({
        id: crypto.randomUUID(),
        companyId: input.companyId,
        employeeId: input.employeeId,
        orderId: input.orderId,
        paymentType: input.paymentType,
        amount: input.amount,
        commissionPercentage: input.commissionPercentage,
        weekStart: input.weekStart,
        month: input.month ?? new Date().getMonth() + 1,
        year: input.year ?? new Date().getFullYear(),
        notes: input.notes,
      });

      if (result.isFailure) return Result.fail(result.getError());

      const payment = result.getValue();
      const savedResult = await this.paymentRepo.create(payment);
      if (savedResult.isFailure) return Result.fail(savedResult.getError());

      return Result.ok(this.toPaymentOutput(savedResult.getValue()));
    } catch (error) {
      return Result.fail(UnexpectedError.from(error));
    }
  }

  private toPaymentOutput(p: EmployeePayment): EmployeePaymentOutputDTO {
    return {
      id: p.id, companyId: p.companyId, employeeId: p.employeeId,
      orderId: p.orderId ?? null, paymentType: p.paymentType, amount: p.amount,
      commissionPercentage: p.commissionPercentage ?? null,
      weekStart: p.weekStart ?? null, month: p.month ?? null, year: p.year ?? null,
      status: p.status, paidAt: p.paidAt ?? null, notes: p.notes ?? null,
      createdAt: p.createdAt, updatedAt: p.updatedAt ?? null,
    };
  }
}

export class RecordExpenseUseCase {
  constructor(private readonly expenseRepo: IExpenseRepository) {}

  async execute(input: CreateExpenseDTO): Promise<Result<ExpenseOutputDTO, FinanceError>> {
    try {
      const result = Expense.create({
        id: crypto.randomUUID(),
        companyId: input.companyId,
        branchId: input.branchId,
        createdBy: input.createdBy,
        expenseType: input.expenseType,
        category: input.category,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        receiptNumber: input.receiptNumber,
        receiptUrl: input.receiptUrl,
        expenseDate: input.expenseDate,
        notes: input.notes,
      });

      if (result.isFailure) return Result.fail(result.getError());

      const expense = result.getValue();
      const savedResult = await this.expenseRepo.create(expense);
      if (savedResult.isFailure) return Result.fail(savedResult.getError());

      return Result.ok(this.toExpenseOutput(savedResult.getValue()));
    } catch (error) {
      return Result.fail(UnexpectedError.from(error));
    }
  }

  private toExpenseOutput(e: Expense): ExpenseOutputDTO {
    return {
      id: e.id, companyId: e.companyId, branchId: e.branchId ?? null,
      createdBy: e.createdBy ?? null, expenseType: e.expenseType,
      category: e.category ?? null, amount: e.amount,
      paymentMethod: e.paymentMethod ?? null, receiptNumber: e.receiptNumber ?? null,
      receiptUrl: e.receiptUrl ?? null, expenseDate: e.expenseDate,
      notes: e.notes ?? null, createdAt: e.createdAt, updatedAt: e.updatedAt ?? null,
    };
  }
}

export class SavingsFundUseCase {
  constructor(private readonly savingsRepo: ISavingsFundRepository) {}

  async execute(input: CreateSavingsFundDTO): Promise<Result<SavingsFundOutputDTO, FinanceError>> {
    try {
      const result = SavingsFund.create({
        id: crypto.randomUUID(),
        companyId: input.companyId,
        amount: input.amount,
        type: input.type,
        reason: input.reason,
        notes: input.notes,
        createdBy: input.createdBy,
      });

      if (result.isFailure) return Result.fail(result.getError());

      const movement = result.getValue();
      const savedResult = await this.savingsRepo.create(movement);
      if (savedResult.isFailure) return Result.fail(savedResult.getError());

      return Result.ok(this.toSavingsFundOutput(savedResult.getValue()));
    } catch (error) {
      return Result.fail(UnexpectedError.from(error));
    }
  }

  private toSavingsFundOutput(s: SavingsFund): SavingsFundOutputDTO {
    return {
      id: s.id, companyId: s.companyId, amount: s.amount,
      type: s.type, reason: s.reason ?? null, notes: s.notes ?? null,
      createdBy: s.createdBy ?? null, createdAt: s.createdAt,
    };
  }
}

export class CreateSalaryAdjustmentUseCase {
  constructor(private readonly adjustmentRepo: ISalaryAdjustmentRepository) {}

  async execute(input: CreateSalaryAdjustmentDTO): Promise<Result<SalaryAdjustmentOutputDTO, FinanceError>> {
    try {
      const result = SalaryAdjustment.create({
        id: crypto.randomUUID(),
        companyId: input.companyId,
        employeeId: input.employeeId,
        type: input.type,
        amount: input.amount,
        loanType: input.loanType,
        notes: input.notes,
      });

      if (result.isFailure) return Result.fail(result.getError());

      const adjustment = result.getValue();
      const savedResult = await this.adjustmentRepo.create(adjustment);
      if (savedResult.isFailure) return Result.fail(savedResult.getError());

      return Result.ok(this.toAdjustmentOutput(savedResult.getValue()));
    } catch (error) {
      return Result.fail(UnexpectedError.from(error));
    }
  }

  private toAdjustmentOutput(a: SalaryAdjustment): SalaryAdjustmentOutputDTO {
    return {
      id: a.id, companyId: a.companyId, employeeId: a.employeeId,
      type: a.type, amount: a.amount, loanType: a.loanType ?? null,
      notes: a.notes ?? null, remainingBalance: a.remainingBalance ?? a.amount,
      isFullyPaid: a.isFullyPaid, createdAt: a.createdAt,
    };
  }
}

export class GetFinanceSummaryUseCase {
  constructor(
    private readonly paymentRepo: IEmployeePaymentRepository,
    private readonly expenseRepo: IExpenseRepository,
    private readonly savingsRepo: ISavingsFundRepository,
    private readonly adjustmentRepo: ISalaryAdjustmentRepository
  ) {}

  async execute(companyId: string, month?: number, year?: number): Promise<Result<FinanceSummaryDTO, FinanceError>> {
    try {
      const m = month ?? new Date().getMonth() + 1;
      const y = year ?? new Date().getFullYear();

      const [payments, expenses, balance, deposits, withdrawals] = await Promise.all([
        this.paymentRepo.getTotalByCompany(companyId, m, y),
        this.expenseRepo.getTotalByCompany(companyId, m, y),
        this.savingsRepo.getBalance(companyId),
        this.savingsRepo.getTotalDeposits(companyId, m, y),
        this.savingsRepo.getTotalWithdrawals(companyId, m, y),
      ]);

      // Check for errors
      for (const result of [payments, expenses, balance, deposits, withdrawals]) {
        if (result.isFailure) return Result.fail(result.getError());
      }

      return Result.ok({
        totalEmployeePayments: payments.getValue(),
        totalExpenses: expenses.getValue(),
        savingsFundBalance: balance.getValue(),
        pendingAdjustments: 0, // TODO: Calculate from adjustments
        currentMonthPayments: payments.getValue(),
        currentMonthExpenses: expenses.getValue(),
        currentMonthDeposits: deposits.getValue(),
        currentMonthWithdrawals: withdrawals.getValue(),
      });
    } catch (error) {
      return Result.fail(UnexpectedError.from(error));
    }
  }
}
