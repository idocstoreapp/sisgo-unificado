/**
 * Supabase implementation of IExpenseRepository
 */

import { Result, NotFoundError, RepositoryError } from "@/shared/kernel";
import type { IExpenseRepository, ExpenseFilters } from "@/domain/repositories/IExpenseRepository";
import type { Expense } from "@/domain/entities/Expense";
import { getSupabaseAdmin } from "@/infrastructure/database/supabase/admin-client";
import type { Database } from "@/infrastructure/database/supabase/database.types";

type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];

export class SupabaseExpenseRepository implements IExpenseRepository {
  async findById(id: string): Promise<Result<Expense, NotFoundError | RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase.from("expenses").select("*").eq("id", id).single();
      if (error) {
        if (error.code === "PGRST116") return Result.fail(new NotFoundError("Expense not found"));
        return Result.fail(new RepositoryError(error.message, error.code));
      }
      if (!data) return Result.fail(new NotFoundError("Expense not found"));
      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching expense", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCompany(companyId: string, filters?: ExpenseFilters): Promise<Result<Expense[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      let query = supabase.from("expenses").select("*").eq("company_id", companyId);
      if (filters?.type) query = query.eq("expense_type", filters.type);
      if (filters?.category) query = query.eq("category", filters.category);
      if (filters?.branchId) query = query.eq("branch_id", filters.branchId);
      if (filters?.dateFrom) query = query.gte("expense_date", filters.dateFrom.toISOString());
      if (filters?.dateTo) query = query.lte("expense_date", filters.dateTo.toISOString());

      const { data, error } = await query.order("expense_date", { ascending: false });
      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok((data ?? []).map(this.toEntity.bind(this)));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching expenses", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async getTotalByCompany(companyId: string, month?: number, year?: number): Promise<Result<number, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      let query = supabase.from("expenses").select("amount").eq("company_id", companyId);
      if (month) query = query.eq("month", month);
      if (year) query = query.eq("year", year);
      const { data, error } = await query;
      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok((data ?? []).reduce((sum, e) => sum + Number(e.amount), 0));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while calculating total expenses", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async getTotalByType(companyId: string, type: string, month?: number, year?: number): Promise<Result<number, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      let query = supabase.from("expenses").select("amount").eq("company_id", companyId).eq("expense_type", type);
      if (month) query = query.eq("month", month);
      if (year) query = query.eq("year", year);
      const { data, error } = await query;
      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok((data ?? []).reduce((sum, e) => sum + Number(e.amount), 0));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while calculating total by type", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async create(expense: Expense): Promise<Result<Expense, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase.from("expenses").insert(this.toInsert(expense)).select().single();
      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while creating expense", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async update(expense: Expense): Promise<Result<Expense, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase.from("expenses").update(this.toUpdate(expense)).eq("id", expense.id).select().single();
      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while updating expense", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while deleting expense", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  private toEntity(row: ExpenseRow): Expense {
    const props = {
      id: row.id,
      companyId: row.company_id,
      branchId: row.branch_id ?? undefined,
      createdBy: row.created_by ?? undefined,
      expenseType: row.expense_type,
      category: row.category ?? undefined,
      amount: Number(row.amount),
      paymentMethod: row.payment_method ?? undefined,
      receiptNumber: row.receipt_number ?? undefined,
      receiptUrl: row.receipt_url ?? undefined,
      expenseDate: new Date(row.expense_date),
      notes: row.notes ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };
    return new Expense(props);
  }

  private toInsert(e: Expense): Database["public"]["Tables"]["expenses"]["Insert"] {
    return {
      id: e.id,
      company_id: e.companyId,
      branch_id: e.branchId ?? null,
      created_by: e.createdBy ?? null,
      expense_type: e.expenseType,
      category: e.category ?? null,
      amount: e.amount,
      payment_method: e.paymentMethod ?? null,
      receipt_number: e.receiptNumber ?? null,
      receipt_url: e.receiptUrl ?? null,
      expense_date: e.expenseDate.toISOString(),
      notes: e.notes ?? null,
    };
  }

  private toUpdate(e: Expense): Database["public"]["Tables"]["expenses"]["Update"] {
    return {
      branch_id: e.branchId ?? null,
      created_by: e.createdBy ?? null,
      expense_type: e.expenseType,
      category: e.category ?? null,
      amount: e.amount,
      payment_method: e.paymentMethod ?? null,
      receipt_number: e.receiptNumber ?? null,
      receipt_url: e.receiptUrl ?? null,
      expense_date: e.expenseDate.toISOString(),
      notes: e.notes ?? null,
      updated_at: e.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}
