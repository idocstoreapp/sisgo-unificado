/**
 * Supabase implementations for SavingsFund and SalaryAdjustment repositories
 */

import { Result, NotFoundError, RepositoryError } from "@/shared/kernel";
import type { ISavingsFundRepository } from "@/domain/repositories/ISavingsFundRepository";
import type { ISalaryAdjustmentRepository } from "@/domain/repositories/ISalaryAdjustmentRepository";
import type { SavingsFund } from "@/domain/entities/SavingsFund";
import type { SalaryAdjustment, AdjustmentType } from "@/domain/entities/SalaryAdjustment";
import { getSupabaseAdmin } from "@/infrastructure/database/supabase/admin-client";
import type { Database } from "@/infrastructure/database/supabase/database.types";

type SavingsFundRow = Database["public"]["Tables"]["savings_fund"]["Row"];
type SalaryAdjustmentRow = Database["public"]["Tables"]["salary_adjustments"]["Row"];

export class SupabaseSavingsFundRepository implements ISavingsFundRepository {
  async findById(id: string): Promise<Result<SavingsFund, NotFoundError | RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase.from("savings_fund").select("*").eq("id", id).single();
      if (error) {
        if (error.code === "PGRST116") return Result.fail(new NotFoundError("Savings fund movement not found"));
        return Result.fail(new RepositoryError(error.message, error.code));
      }
      if (!data) return Result.fail(new NotFoundError("Savings fund movement not found"));
      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCompany(companyId: string): Promise<Result<SavingsFund[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase.from("savings_fund").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok((data ?? []).map(this.toEntity.bind(this)));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async getBalance(companyId: string): Promise<Result<number, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase.from("savings_fund").select("amount, type").eq("company_id", companyId);
      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      const balance = (data ?? []).reduce((sum, m) => {
        return m.type === "deposit" ? sum + Number(m.amount) : sum - Number(m.amount);
      }, 0);
      return Result.ok(balance);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async getTotalDeposits(companyId: string, month?: number, year?: number): Promise<Result<number, RepositoryError>> {
    return this.getTotalByType(companyId, "deposit", month, year);
  }

  async getTotalWithdrawals(companyId: string, month?: number, year?: number): Promise<Result<number, RepositoryError>> {
    return this.getTotalByType(companyId, "withdrawal", month, year);
  }

  async create(savingsFund: SavingsFund): Promise<Result<SavingsFund, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("savings_fund")
        .insert({ id: savingsFund.id, company_id: savingsFund.companyId, amount: savingsFund.amount, type: savingsFund.type, reason: savingsFund.reason ?? null, notes: savingsFund.notes ?? null, created_by: savingsFund.createdBy ?? null })
        .select()
        .single();
      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { error } = await supabase.from("savings_fund").delete().eq("id", id);
      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  private async getTotalByType(companyId: string, type: string, month?: number, year?: number): Promise<Result<number, RepositoryError>> {
    const supabase = await getSupabaseAdmin();
    let query = supabase.from("savings_fund").select("amount").eq("company_id", companyId).eq("type", type);
    if (year) query = query.eq("year", year);
    const { data, error } = await query;
    if (error) return Result.fail(new RepositoryError(error.message, error.code));
    return Result.ok((data ?? []).reduce((sum, m) => sum + Number(m.amount), 0));
  }

  private toEntity(row: SavingsFundRow): SavingsFund {
    return new SavingsFund({
      id: row.id,
      companyId: row.company_id,
      amount: Number(row.amount),
      type: row.type as "deposit" | "withdrawal",
      reason: row.reason ?? undefined,
      notes: row.notes ?? undefined,
      createdBy: row.created_by ?? undefined,
      createdAt: new Date(row.created_at),
    });
  }
}

export class SupabaseSalaryAdjustmentRepository implements ISalaryAdjustmentRepository {
  async findById(id: string): Promise<Result<SalaryAdjustment, NotFoundError | RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase.from("salary_adjustments").select("*").eq("id", id).single();
      if (error) {
        if (error.code === "PGRST116") return Result.fail(new NotFoundError("Salary adjustment not found"));
        return Result.fail(new RepositoryError(error.message, error.code));
      }
      if (!data) return Result.fail(new NotFoundError("Salary adjustment not found"));
      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByEmployee(employeeId: string): Promise<Result<SalaryAdjustment[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase.from("salary_adjustments").select("*").eq("employee_id", employeeId).order("created_at", { ascending: false });
      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok((data ?? []).map(this.toEntity.bind(this)));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCompany(companyId: string): Promise<Result<SalaryAdjustment[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase.from("salary_adjustments").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok((data ?? []).map(this.toEntity.bind(this)));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async getPendingByEmployee(employeeId: string): Promise<Result<SalaryAdjustment[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase.from("salary_adjustments").select("*").eq("employee_id", employeeId).eq("is_fully_paid", false).order("created_at", { ascending: true });
      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok((data ?? []).map(this.toEntity.bind(this)));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async getTotalByType(employeeId: string, type: AdjustmentType): Promise<Result<number, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase.from("salary_adjustments").select("amount").eq("employee_id", employeeId).eq("type", type);
      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok((data ?? []).reduce((sum, a) => sum + Number(a.amount), 0));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async create(adjustment: SalaryAdjustment): Promise<Result<SalaryAdjustment, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("salary_adjustments")
        .insert({ id: adjustment.id, company_id: adjustment.companyId, employee_id: adjustment.employeeId, type: adjustment.type, amount: adjustment.amount, loan_type: adjustment.loanType ?? null, notes: adjustment.notes ?? null, remaining_balance: adjustment.remainingBalance ?? adjustment.amount, is_fully_paid: adjustment.isFullyPaid })
        .select()
        .single();
      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async update(adjustment: SalaryAdjustment): Promise<Result<SalaryAdjustment, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("salary_adjustments")
        .update({ type: adjustment.type, amount: adjustment.amount, loan_type: adjustment.loanType ?? null, notes: adjustment.notes ?? null, remaining_balance: adjustment.remainingBalance, is_fully_paid: adjustment.isFullyPaid, updated_at: new Date().toISOString() })
        .eq("id", adjustment.id)
        .select()
        .single();
      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { error } = await supabase.from("salary_adjustments").delete().eq("id", id);
      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  private toEntity(row: SalaryAdjustmentRow): SalaryAdjustment {
    return new SalaryAdjustment({
      id: row.id,
      companyId: row.company_id,
      employeeId: row.employee_id,
      type: row.type as AdjustmentType,
      amount: Number(row.amount),
      loanType: row.loan_type ?? undefined,
      notes: row.notes ?? undefined,
      remainingBalance: Number(row.remaining_balance),
      isFullyPaid: row.is_fully_paid,
      createdAt: new Date(row.created_at),
    });
  }
}
