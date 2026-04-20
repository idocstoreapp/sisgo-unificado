/**
 * Supabase implementation of ICustomerRepository
 */

import { Result, NotFoundError, RepositoryError } from "@/shared/kernel";
import type { ICustomerRepository } from "@/domain/repositories/ICustomerRepository";
import type { Customer } from "@/domain/entities/Customer";
import { getSupabaseAdmin } from "@/infrastructure/database/supabase/admin-client";
import { toCustomer, fromCustomerToInsert, fromCustomerToUpdate } from "@/infrastructure/database/supabase/mappers";

export class SupabaseCustomerRepository implements ICustomerRepository {
  async findById(id: string): Promise<Result<Customer, NotFoundError | RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return Result.fail(new NotFoundError("Customer not found"));
        }
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      if (!data) {
        return Result.fail(new NotFoundError("Customer not found"));
      }

      return Result.ok(toCustomer(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching customer", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByEmailAndCompany(email: string, companyId: string): Promise<Result<Customer | null, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("email", email.toLowerCase())
        .eq("company_id", companyId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return Result.ok(null);
        }
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(data ? toCustomer(data) : null);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching customer by email and company", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByPhoneAndCompany(phone: string, companyId: string): Promise<Result<Customer | null, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("phone", phone)
        .eq("company_id", companyId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return Result.ok(null);
        }
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(data ? toCustomer(data) : null);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching customer by phone and company", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async searchByName(query: string, companyId: string): Promise<Result<Customer[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("company_id", companyId)
        .ilike("name", `%${query}%`)
        .order("name", { ascending: true })
        .limit(20);

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const customers = (data ?? []).map(toCustomer);
      return Result.ok(customers);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while searching customers by name", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCompanyId(companyId: string): Promise<Result<Customer[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("company_id", companyId)
        .order("name", { ascending: true })
        .limit(100);

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const customers = (data ?? []).map(toCustomer);
      return Result.ok(customers);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching customers by company", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async create(customer: Customer): Promise<Result<Customer, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const insertData = fromCustomerToInsert(customer);
      const { data, error } = await supabase
        .from("customers")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(toCustomer(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while creating customer", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async update(customer: Customer): Promise<Result<Customer, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const updateData = fromCustomerToUpdate(customer);
      const { data, error } = await supabase
        .from("customers")
        .update(updateData)
        .eq("id", customer.id)
        .select()
        .single();

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(toCustomer(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while updating customer", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id);

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while deleting customer", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }
}
