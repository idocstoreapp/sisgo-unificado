/**
 * Supabase implementation of IQuoteRepository
 */

import { Result, NotFoundError, RepositoryError } from "@/shared/kernel";
import type { IQuoteRepository, QuoteFilters } from "@/domain/repositories/IQuoteRepository";
import type { Quote, QuoteItem } from "@/domain/entities/Quote";
import { getSupabaseAdmin } from "@/infrastructure/database/supabase/admin-client";
import type { Database } from "@/infrastructure/database/supabase/database.types";

type QuoteRow = Database["public"]["Tables"]["quotes"]["Row"];
type QuoteItemRow = Database["public"]["Tables"]["quote_items"]["Row"];

export class SupabaseQuoteRepository implements IQuoteRepository {
  async findById(id: string): Promise<Result<Quote, NotFoundError | RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("quotes")
        .select("*, quote_items(*)")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return Result.fail(new NotFoundError("Quote not found"));
        }
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      if (!data) {
        return Result.fail(new NotFoundError("Quote not found"));
      }

      return Result.ok(this.toEntity(data, data.quote_items || []));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching quote", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByQuoteNumber(quoteNumber: string, companyId: string): Promise<Result<Quote | null, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("quotes")
        .select("*, quote_items(*)")
        .eq("quote_number", quoteNumber)
        .eq("company_id", companyId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return Result.ok(null);
        }
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(data ? this.toEntity(data, data.quote_items || []) : null);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching quote by number", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCompany(companyId: string, filters?: QuoteFilters): Promise<Result<Quote[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      let query = supabase
        .from("quotes")
        .select("*, quote_items(*)")
        .eq("company_id", companyId);

      // Apply filters
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.customerId) {
        query = query.eq("customer_id", filters.customerId);
      }
      if (filters?.search) {
        query = query.ilike("quote_number", `%${filters.search}%`).or(`customer_name.ilike.%${filters.search}%`);
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

      const quotes = (data || []).map((row) => this.toEntity(row, row.quote_items || []));
      return Result.ok(quotes);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching quotes", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCustomer(customerId: string): Promise<Result<Quote[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("quotes")
        .select("*, quote_items(*)")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const quotes = (data || []).map((row) => this.toEntity(row, row.quote_items || []));
      return Result.ok(quotes);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching customer quotes", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async countByStatus(companyId: string, status: Quote["status"]): Promise<Result<number, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { count, error } = await supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("status", status);

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(count || 0);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while counting quotes", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async create(quote: Quote): Promise<Result<Quote, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();

      // Insert quote
      const insertData = this.toInsert(quote);
      const { data: quoteData, error: quoteError } = await supabase
        .from("quotes")
        .insert(insertData)
        .select()
        .single();

      if (quoteError) {
        return Result.fail(new RepositoryError(quoteError.message, quoteError.code));
      }

      // Insert quote items
      if (quote.items.length > 0) {
        const itemsToInsert = quote.items.map((item) => this.itemToInsert(item, quoteData.id));
        const { error: itemsError } = await supabase.from("quote_items").insert(itemsToInsert);

        if (itemsError) {
          return Result.fail(new RepositoryError(itemsError.message, itemsError.code));
        }
      }

      // Fetch created quote with items
      const { data: fullData, error: fetchError } = await supabase
        .from("quotes")
        .select("*, quote_items(*)")
        .eq("id", quoteData.id)
        .single();

      if (fetchError) {
        return Result.fail(new RepositoryError(fetchError.message, fetchError.code));
      }

      return Result.ok(this.toEntity(fullData, fullData.quote_items || []));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while creating quote", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async update(quote: Quote): Promise<Result<Quote, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();

      // Update quote
      const updateData = this.toUpdate(quote);
      const { error: quoteError } = await supabase
        .from("quotes")
        .update(updateData)
        .eq("id", quote.id);

      if (quoteError) {
        return Result.fail(new RepositoryError(quoteError.message, quoteError.code));
      }

      // Delete existing items and re-insert (simplified approach)
      const { error: deleteError } = await supabase.from("quote_items").delete().eq("quote_id", quote.id);

      if (deleteError) {
        return Result.fail(new RepositoryError(deleteError.message, deleteError.code));
      }

      if (quote.items.length > 0) {
        const itemsToInsert = quote.items.map((item) => this.itemToInsert(item, quote.id));
        const { error: itemsError } = await supabase.from("quote_items").insert(itemsToInsert);

        if (itemsError) {
          return Result.fail(new RepositoryError(itemsError.message, itemsError.code));
        }
      }

      // Fetch updated quote with items
      const { data: fullData, error: fetchError } = await supabase
        .from("quotes")
        .select("*, quote_items(*)")
        .eq("id", quote.id)
        .single();

      if (fetchError) {
        return Result.fail(new RepositoryError(fetchError.message, fetchError.code));
      }

      return Result.ok(this.toEntity(fullData, fullData.quote_items || []));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while updating quote", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { error } = await supabase.from("quotes").delete().eq("id", id);

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while deleting quote", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async getNextQuoteNumber(companyId: string): Promise<Result<string, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const currentYear = new Date().getFullYear();
      const prefix = `COT-${currentYear}-`;

      const { data, error } = await supabase
        .from("quotes")
        .select("quote_number")
        .eq("company_id", companyId)
        .ilike("quote_number", `${prefix}%`)
        .order("quote_number", { ascending: false })
        .limit(1);

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      let nextSeq = 1;
      if (data && data.length > 0 && data[0].quote_number) {
        const lastNumber = data[0].quote_number;
        const lastSeqStr = lastNumber.substring(prefix.length);
        const lastSeq = parseInt(lastSeqStr, 10);
        if (!isNaN(lastSeq)) {
          nextSeq = lastSeq + 1;
        }
      }

      return Result.ok(`${prefix}${String(nextSeq).padStart(4, "0")}`);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while generating quote number", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  // Private helpers

  private toEntity(row: QuoteRow, items: QuoteItemRow[]): Quote {
    const quoteItems = items.map((item) => {
      const props = {
        id: item.id,
        quoteId: item.quote_id,
        itemType: item.item_type as QuoteItem["itemType"],
        name: item.name,
        description: item.description ?? undefined,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        totalPrice: Number(item.total_price),
        metadata: (item.metadata as Record<string, unknown>) ?? undefined,
      };
      return new QuoteItem(props);
    });

    const props = {
      id: row.id,
      companyId: row.company_id,
      branchId: row.branch_id ?? undefined,
      customerId: row.customer_id,
      customerName: row.customer_name,
      customerEmail: row.customer_email ?? undefined,
      customerPhone: row.customer_phone ?? undefined,
      quoteNumber: row.quote_number,
      status: row.status as Quote["status"],
      items: quoteItems,
      subtotal: Number(row.subtotal),
      ivaPercentage: Number(row.iva_percentage ?? 19),
      ivaAmount: Number(row.iva_amount ?? 0),
      profitMargin: Number(row.profit_margin ?? 0),
      profitAmount: Number(row.profit_amount ?? 0),
      total: Number(row.total),
      notes: row.notes ?? undefined,
      terms: row.terms ?? undefined,
      validUntil: row.valid_until ? new Date(row.valid_until) : undefined,
      approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
      rejectedAt: row.rejected_at ? new Date(row.rejected_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };

    return new Quote(props);
  }

  private toInsert(quote: Quote): Database["public"]["Tables"]["quotes"]["Insert"] {
    return {
      id: quote.id,
      company_id: quote.companyId,
      branch_id: quote.branchId ?? null,
      customer_id: quote.customerId,
      customer_name: quote.customerName,
      customer_email: quote.customerEmail ?? null,
      customer_phone: quote.customerPhone ?? null,
      quote_number: quote.quoteNumber,
      status: quote.status,
      subtotal: quote.subtotal,
      iva_percentage: quote.ivaPercentage,
      iva_amount: quote.ivaAmount,
      profit_margin: quote.profitMargin,
      profit_amount: quote.profitAmount,
      total: quote.total,
      notes: quote.notes ?? null,
      terms: quote.terms ?? null,
      valid_until: quote.validUntil?.toISOString() ?? null,
      approved_at: quote.approvedAt?.toISOString() ?? null,
      rejected_at: quote.rejectedAt?.toISOString() ?? null,
    };
  }

  private toUpdate(quote: Quote): Database["public"]["Tables"]["quotes"]["Update"] {
    return {
      branch_id: quote.branchId ?? null,
      customer_id: quote.customerId,
      customer_name: quote.customerName,
      customer_email: quote.customerEmail ?? null,
      customer_phone: quote.customerPhone ?? null,
      quote_number: quote.quoteNumber,
      status: quote.status,
      subtotal: quote.subtotal,
      iva_percentage: quote.ivaPercentage,
      iva_amount: quote.ivaAmount,
      profit_margin: quote.profitMargin,
      profit_amount: quote.profitAmount,
      total: quote.total,
      notes: quote.notes ?? null,
      terms: quote.terms ?? null,
      valid_until: quote.validUntil?.toISOString() ?? null,
      approved_at: quote.approvedAt?.toISOString() ?? null,
      rejected_at: quote.rejectedAt?.toISOString() ?? null,
      updated_at: quote.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  private itemToInsert(
    item: QuoteItem,
    quoteId: string
  ): Database["public"]["Tables"]["quote_items"]["Insert"] {
    return {
      id: item.id,
      quote_id: quoteId,
      item_type: item.itemType,
      name: item.name,
      description: item.description ?? null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      metadata: item.metadata ?? null,
    };
  }
}
