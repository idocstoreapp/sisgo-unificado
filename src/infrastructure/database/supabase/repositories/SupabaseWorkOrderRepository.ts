/**
 * Supabase implementation of IWorkOrderRepository
 */

import { Result, NotFoundError, RepositoryError } from "@/shared/kernel";
import type { IWorkOrderRepository, OrderFilters } from "@/domain/repositories/IWorkOrderRepository";
import type { WorkOrder } from "@/domain/entities/WorkOrder";
import { getSupabaseAdmin } from "@/infrastructure/database/supabase/admin-client";
import type { Database } from "@/infrastructure/database/supabase/database.types";

type WorkOrderRow = Database["public"]["Tables"]["work_orders"]["Row"];

export class SupabaseWorkOrderRepository implements IWorkOrderRepository {
  async findById(id: string): Promise<Result<WorkOrder, NotFoundError | RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return Result.fail(new NotFoundError("Work order not found"));
        }
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      if (!data) {
        return Result.fail(new NotFoundError("Work order not found"));
      }

      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching work order", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByOrderNumber(orderNumber: string, companyId: string): Promise<Result<WorkOrder | null, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("order_number", orderNumber)
        .eq("company_id", companyId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return Result.ok(null);
        }
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(data ? this.toEntity(data) : null);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching work order by number", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCompany(companyId: string, filters?: OrderFilters): Promise<Result<WorkOrder[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      let query = supabase
        .from("work_orders")
        .select("*")
        .eq("company_id", companyId);

      // Apply filters
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.priority) {
        query = query.eq("priority", filters.priority);
      }
      if (filters?.assignedTo) {
        query = query.eq("assigned_to", filters.assignedTo);
      }
      if (filters?.customerId) {
        query = query.eq("customer_id", filters.customerId);
      }
      if (filters?.search) {
        query = query.ilike("order_number", `%${filters.search}%`);
      }
      if (filters?.dateFrom) {
        query = query.gte("created_at", filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        query = query.lte("created_at", filters.dateTo.toISOString());
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const orders = (data ?? []).map(this.toEntity.bind(this));
      return Result.ok(orders);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching work orders by company", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByAssignedTo(technicianId: string): Promise<Result<WorkOrder[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("assigned_to", technicianId)
        .order("created_at", { ascending: false });

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const orders = (data ?? []).map(this.toEntity.bind(this));
      return Result.ok(orders);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching work orders by assigned technician", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCustomer(customerId: string): Promise<Result<WorkOrder[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const orders = (data ?? []).map(this.toEntity.bind(this));
      return Result.ok(orders);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching work orders by customer", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async countByStatus(companyId: string, status: string): Promise<Result<number, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { count, error } = await supabase
        .from("work_orders")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("status", status);

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(count ?? 0);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while counting work orders by status", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async create(order: WorkOrder): Promise<Result<WorkOrder, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const insertData = this.toInsert(order);
      const { data, error } = await supabase
        .from("work_orders")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while creating work order", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async update(order: WorkOrder): Promise<Result<WorkOrder, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const updateData = this.toUpdate(order);
      const { data, error } = await supabase
        .from("work_orders")
        .update(updateData)
        .eq("id", order.id)
        .select()
        .single();

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while updating work order", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { error } = await supabase
        .from("work_orders")
        .delete()
        .eq("id", id);

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while deleting work order", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async getNextOrderNumber(companyId: string): Promise<Result<string, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const year = new Date().getFullYear();
      const prefix = `OT-${year}-`;

      const { data, error } = await supabase
        .from("work_orders")
        .select("order_number")
        .eq("company_id", companyId)
        .like("order_number", `${prefix}%`)
        .order("order_number", { ascending: false })
        .limit(1);

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      // Extract sequence number and increment
      let nextSeq = 1;
      if (data && data.length > 0 && data[0].order_number) {
        const lastNumber = data[0].order_number;
        const seqStr = lastNumber.replace(prefix, "");
        const lastSeq = parseInt(seqStr, 10);
        if (!isNaN(lastSeq)) {
          nextSeq = lastSeq + 1;
        }
      }

      return Result.ok(`${prefix}${String(nextSeq).padStart(4, "0")}`);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while generating order number", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  // Private helpers

  private toEntity(row: WorkOrderRow): WorkOrder {
    const props = {
      id: row.id,
      companyId: row.company_id,
      branchId: row.branch_id ?? undefined,
      customerId: row.customer_id,
      assignedTo: row.assigned_to ?? undefined,
      createdBy: row.created_by ?? undefined,
      orderNumber: row.order_number,
      businessType: row.business_type,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      status: row.status as WorkOrder["status"],
      priority: row.priority as WorkOrder["priority"],
      commitmentDate: row.commitment_date ? new Date(row.commitment_date) : undefined,
      deliveredAt: row.delivered_at ? new Date(row.delivered_at) : undefined,
      replacementCost: Number(row.replacement_cost),
      laborCost: Number(row.labor_cost),
      totalCost: Number(row.total_cost),
      totalPrice: Number(row.total_price),
      paymentMethod: row.payment_method as WorkOrder["paymentMethod"],
      receiptNumber: row.receipt_number ?? undefined,
      paidAt: row.paid_at ? new Date(row.paid_at) : undefined,
      warrantyDays: row.warranty_days ?? 30,
      warrantyExpiresAt: row.warranty_expires_at ? new Date(row.warranty_expires_at) : undefined,
      notes: row.notes ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };

    return new WorkOrder(props);
  }

  private toInsert(order: WorkOrder): Database["public"]["Tables"]["work_orders"]["Insert"] {
    return {
      id: order.id,
      company_id: order.companyId,
      branch_id: order.branchId ?? null,
      customer_id: order.customerId,
      assigned_to: order.assignedTo ?? null,
      created_by: order.createdBy ?? null,
      order_number: order.orderNumber,
      business_type: order.businessType,
      metadata: order.metadata,
      status: order.status,
      priority: order.priority,
      commitment_date: order.commitmentDate?.toISOString() ?? null,
      delivered_at: order.deliveredAt?.toISOString() ?? null,
      replacement_cost: order.replacementCost,
      labor_cost: order.laborCost,
      total_cost: order.totalCost,
      total_price: order.totalPrice,
      payment_method: order.paymentMethod ?? null,
      receipt_number: order.receiptNumber ?? null,
      paid_at: order.paidAt?.toISOString() ?? null,
      warranty_days: order.warrantyDays,
      warranty_expires_at: order.warrantyExpiresAt?.toISOString() ?? null,
      notes: order.notes ?? null,
    };
  }

  private toUpdate(order: WorkOrder): Database["public"]["Tables"]["work_orders"]["Update"] {
    return {
      branch_id: order.branchId ?? null,
      customer_id: order.customerId,
      assigned_to: order.assignedTo ?? null,
      created_by: order.createdBy ?? null,
      order_number: order.orderNumber,
      business_type: order.businessType,
      metadata: order.metadata,
      status: order.status,
      priority: order.priority,
      commitment_date: order.commitmentDate?.toISOString() ?? null,
      delivered_at: order.deliveredAt?.toISOString() ?? null,
      replacement_cost: order.replacementCost,
      labor_cost: order.laborCost,
      total_cost: order.totalCost,
      total_price: order.totalPrice,
      payment_method: order.paymentMethod ?? null,
      receipt_number: order.receiptNumber ?? null,
      paid_at: order.paidAt?.toISOString() ?? null,
      warranty_days: order.warrantyDays,
      warranty_expires_at: order.warrantyExpiresAt?.toISOString() ?? null,
      notes: order.notes ?? null,
      updated_at: order.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}
