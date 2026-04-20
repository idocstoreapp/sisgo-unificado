/**
 * Finance DTOs
 */

import type { PaymentType, PaymentStatus } from "@/domain/entities/EmployeePayment";
import type { AdjustmentType } from "@/domain/entities/SalaryAdjustment";
import type { SavingsFundType } from "@/domain/entities/SavingsFund";

// Employee Payment DTOs
export interface CreateEmployeePaymentDTO {
  companyId: string;
  employeeId: string;
  orderId?: string;
  paymentType: PaymentType;
  amount: number;
  commissionPercentage?: number;
  weekStart?: Date;
  month?: number;
  year?: number;
  notes?: string;
}

export interface EmployeePaymentOutputDTO {
  id: string;
  companyId: string;
  employeeId: string;
  orderId: string | null;
  paymentType: PaymentType;
  amount: number;
  commissionPercentage: number | null;
  weekStart: Date | null;
  month: number | null;
  year: number | null;
  status: PaymentStatus;
  paidAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

// Expense DTOs
export interface CreateExpenseDTO {
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
}

export interface ExpenseOutputDTO {
  id: string;
  companyId: string;
  branchId: string | null;
  createdBy: string | null;
  expenseType: string;
  category: string | null;
  amount: number;
  paymentMethod: string | null;
  receiptNumber: string | null;
  receiptUrl: string | null;
  expenseDate: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

// Savings Fund DTOs
export interface CreateSavingsFundDTO {
  companyId: string;
  amount: number;
  type: SavingsFundType;
  reason?: string;
  notes?: string;
  createdBy?: string;
}

export interface SavingsFundOutputDTO {
  id: string;
  companyId: string;
  amount: number;
  type: SavingsFundType;
  reason: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: Date;
}

// Salary Adjustment DTOs
export interface CreateSalaryAdjustmentDTO {
  companyId: string;
  employeeId: string;
  type: AdjustmentType;
  amount: number;
  loanType?: string;
  notes?: string;
}

export interface SalaryAdjustmentOutputDTO {
  id: string;
  companyId: string;
  employeeId: string;
  type: AdjustmentType;
  amount: number;
  loanType: string | null;
  notes: string | null;
  remainingBalance: number;
  isFullyPaid: boolean;
  createdAt: Date;
}

// Dashboard/Report DTOs
export interface FinanceSummaryDTO {
  totalEmployeePayments: number;
  totalExpenses: number;
  savingsFundBalance: number;
  pendingAdjustments: number;
  currentMonthPayments: number;
  currentMonthExpenses: number;
  currentMonthDeposits: number;
  currentMonthWithdrawals: number;
}

export interface CommissionReportDTO {
  employeeId: string;
  employeeName: string;
  totalCommissions: number;
  paidCommissions: number;
  pendingCommissions: number;
  ordersCompleted: number;
  weekStart?: Date;
  month?: number;
  year?: number;
}
