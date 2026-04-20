/**
 * Supabase implementation of IEmployeePaymentRepository
 */

import { Result, NotFoundError, RepositoryError } from "@/shared/kernel";
import type { IEmployeePaymentRepository } from "@/domain/repositories/IEmployeePaymentRepository";
import type { EmployeePayment } from "@/domain/entities/EmployeePayment";
import type { PaymentType, PaymentStatus } from "@/domain/entities/EmployeePayment";
import { getSupabaseAdmin } from "@/infrastructure/database/supabase/admin-client";
import type { Database } from "@/infrastructure/database/supabase/database.types";

type EmployeePaymentRow = Database["public"]["Tables"]["employee_payments"]["Row"];

export class SupabaseEmployeePaymentRepository implements IEmployeePaymentRepository {
  async findById(id: string): Promise<Result<EmployeePayment, NotFoundError | RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase.from("employee_payments").select("*").eq("id", id).single();

      if (error) {
        if (error.code === "PGRST116") return Result.fail(new NotFoundError("Employee payment not found"));
        return Result.fail(new RepositoryError(error.message, error.code));
      }
      if (!data) return Result.fail(new NotFoundError("Employee payment not found"));

      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching employee payment", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByEmployeeId(employeeId: string): Promise<Result<EmployeePayment[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("employee_payments")
        .select("*")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false });

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok((data ?? []).map(this.toEntity.bind(this)));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching employee payments", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCompanyAndPeriod(companyId: string, month?: number, year?: number): Promise<Result<EmployeePayment[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      let query = supabase.from("employee_payments").select("*").eq("company_id", companyId);

      if (month) query = query.eq("month", month);
      if (year) query = query.eq("year", year);

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok((data ?? []).map(this.toEntity.bind(this)));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching employee payments by period", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByOrderId(orderId: string): Promise<Result<EmployeePayment[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("employee_payments")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok((data ?? []).map(this.toEntity.bind(this)));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching employee payments by order", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async getTotalByEmployee(employeeId: string, type?: string, status?: string): Promise<Result<number, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      let query = supabase.from("employee_payments").select("amount", { count: "exact", head: false }).eq("employee_id", employeeId);

      if (type) query = query.eq("payment_type", type);
      if (status) query = query.eq("status", status);

      const { data, error } = await query;
      if (error) return Result.fail(new RepositoryError(error.message, error.code));

      const total = (data ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
      return Result.ok(total);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while calculating total", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async getTotalByCompany(companyId: string, month?: number, year?: number): Promise<Result<number, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      let query = supabase.from("employee_payments").select("amount").eq("company_id", companyId);

      if (month) query = query.eq("month", month);
      if (year) query = query.eq("year", year);

      const { data, error } = await query;
      if (error) return Result.fail(new RepositoryError(error.message, error.code));

      const total = (data ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
      return Result.ok(total);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while calculating total by company", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async create(payment: EmployeePayment): Promise<Result<EmployeePayment, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase.from("employee_payments").insert(this.toInsert(payment)).select().single();

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while creating employee payment", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async update(payment: EmployeePayment): Promise<Result<EmployeePayment, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("employee_payments")
        .update(this.toUpdate(payment))
        .eq("id", payment.id)
        .select()
        .single();

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while updating employee payment", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { error } = await supabase.from("employee_payments").delete().eq("id", id);

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while deleting employee payment", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  private toEntity(row: EmployeePaymentRow): EmployeePayment {
    return new EmployeePayment({
      id: row.id,
      companyId: row.company_id,
      employeeId: row.employee_id,
      orderId: row.order_id ?? undefined,
      paymentType: row.payment_type as PaymentType,
      amount: Number(row.amount),
      commissionPercentage: row.commission_percentage != null ? Number(row.commission_percentage) : undefined,
      weekStart: row.week_start ? new Date(row.week_start) : undefined,
      month: row.month ?? undefined,
      year: row.year ?? undefined,
      status: row.status as PaymentStatus,
      paidAt: row.paid_at ? new Date(row.paid_at) : undefined,
      notes: row.notes ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    });
  }

  private toInsert(p: EmployeePayment): Database["public"]["Tables"]["employee_payments"]["Insert"] {
    return {
      id: p.id,
      company_id: p.companyId,
      employee_id: p.employeeId,
      order_id: p.orderId ?? null,
      payment_type: p.paymentType,
      amount: p.amount,
      commission_percentage: p.commissionPercentage ?? null,
      week_start: p.weekStart?.toISOString() ?? null,
      month: p.month ?? null,
      year: p.year ?? null,
      status: p.status,
      paid_at: p.paidAt?.toISOString() ?? null,
      notes: p.notes ?? null,
    };
  }

  private toUpdate(p: EmployeePayment): Database["public"]["Tables"]["employee_payments"]["Update"] {
    return {
      order_id: p.orderId ?? null,
      payment_type: p.paymentType,
      amount: p.amount,
      commission_percentage: p.commissionPercentage ?? null,
      week_start: p.weekStart?.toISOString() ?? null,
      month: p.month ?? null,
      year: p.year ?? null,
      status: p.status,
      paid_at: p.paidAt?.toISOString() ?? null,
      notes: p.notes ?? null,
      updated_at: p.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}
